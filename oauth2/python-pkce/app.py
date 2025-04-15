#!/usr/bin/env python3
"""
DocSpace OAuth 2.0 PKCE Demo Application

This application demonstrates the OAuth 2.0 authorization code flow with PKCE (Proof Key for Code Exchange)
for DocSpace. PKCE adds an extra layer of security to the authorization code flow,
particularly for public clients that cannot securely store a client secret.
"""

import os
import json
import base64
import hashlib
import secrets
import urllib.parse
import urllib.request
import http.server
import socketserver
from http import cookies
from urllib.parse import parse_qs, urlparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set the port for the web server
PORT = int(os.getenv('PORT', 3000))

# Store the code verifier for PKCE
code_verifier = None

def generate_pkce_pair():
    """
    Generate a PKCE (Proof Key for Code Exchange) pair
    
    Returns:
        tuple: (code_verifier, code_challenge)
    """
    # Generate a random string for the code verifier (between 43 and 128 characters)
    verifier = secrets.token_urlsafe(32)
    
    # Create the code challenge by hashing the verifier with SHA-256
    # and encoding it as base64url
    digest = hashlib.sha256(verifier.encode('utf-8')).digest()
    challenge = base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
    
    return verifier, challenge

class DocSpaceOAuthHandler(http.server.SimpleHTTPRequestHandler):
    """Handler for the DocSpace OAuth flow with PKCE"""

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Root endpoint - serves the login page
        if path == '/':
            self.serve_file('static/index.html')
            return

        # Authentication endpoint - initiates the OAuth flow with PKCE
        elif path == '/authenticate':
            self.handle_authenticate()
            return

        # Callback endpoint - handles the OAuth callback
        elif path == '/callback':
            self.handle_callback(parsed_path)
            return

        # Serve static files
        elif path.startswith('/static/'):
            filename = path[1:]  # Remove leading slash
            print(f"Attempting to serve static file: {filename}")
            self.serve_file(filename)
            return

        # Default 404 response
        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'Not Found')

    def serve_file(self, filename):
        """Serve a static file"""
        try:
            with open(filename, 'rb') as file:
                content = file.read()
                
                self.send_response(200)
                
                # Set content type based on file extension
                if filename.endswith('.html'):
                    self.send_header('Content-type', 'text/html')
                elif filename.endswith('.css'):
                    self.send_header('Content-type', 'text/css')
                elif filename.endswith('.js'):
                    self.send_header('Content-type', 'application/javascript')
                    
                self.end_headers()
                self.wfile.write(content)
        except FileNotFoundError:
            print(f"File not found: {filename}")
            self.send_response(404)
            self.end_headers()
            self.wfile.write(f"File not found: {filename}".encode('utf-8'))

    def handle_authenticate(self):
        """Handle the authentication request and redirect to DocSpace with PKCE"""
        global code_verifier
        
        # Generate PKCE pair
        code_verifier, code_challenge = generate_pkce_pair()
        print(f"Generated code_verifier: {code_verifier[:10]}... (keeping it secret)")
        print(f"Generated code_challenge: {code_challenge}")
        
        api_base_url = os.getenv('API_BASE_URL')
        response_type = os.getenv('RESPONSE_TYPE')
        client_id = os.getenv('CLIENT_ID')
        redirect_uri = os.getenv('REDIRECT_URI')
        client_scopes = os.getenv('CLIENT_SCOPES')
        
        # Build the authorization URL with PKCE
        auth_url = (
            f"{api_base_url}/oauth2/authorize"
            f"?response_type={response_type}"
            f"&client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope={client_scopes}"
            f"&code_challenge={code_challenge}"
            f"&code_challenge_method=S256"
        )
        
        print(f"Redirecting to: {auth_url}")
        
        # Redirect to the authorization endpoint
        self.send_response(302)
        self.send_header('Location', auth_url)
        self.end_headers()

    def handle_callback(self, parsed_path):
        """Handle the OAuth callback after user authentication"""
        global code_verifier
        
        # Parse query parameters
        query = parse_qs(parsed_path.query)
        
        # Get the authorization code
        if 'code' in query:
            auth_code = query['code'][0]
            print(f"Received authorization code: {auth_code[:10]}... (truncated)")
            
            try:
                # Prepare the token request
                token_url = f"{os.getenv('API_BASE_URL')}/oauth2/token"
                data = {
                    'client_id': os.getenv('CLIENT_ID'),
                    'code': auth_code,
                    'redirect_uri': os.getenv('REDIRECT_URI'),
                    'grant_type': 'authorization_code',
                    'code_verifier': code_verifier  # Include the code verifier for PKCE
                }
                
                print(f"Sending token request with code_verifier: {code_verifier[:10]}... (truncated)")
                
                # Encode the data
                encoded_data = urllib.parse.urlencode(data).encode('utf-8')
                
                # Make the token request
                req = urllib.request.Request(token_url, data=encoded_data, method='POST')
                req.add_header('Content-Type', 'application/x-www-form-urlencoded')
                
                # Get the token response
                with urllib.request.urlopen(req) as response:
                    token_data = json.loads(response.read().decode('utf-8'))
                    
                    # Extract tokens
                    access_token = token_data.get('access_token')
                    refresh_token = token_data.get('refresh_token')
                    
                    print(f"Received access_token: {access_token[:10]}... (truncated)")
                    
                    # Set cookies for tokens
                    cookie = cookies.SimpleCookie()
                    cookie['token'] = access_token
                    cookie['refresh_token'] = refresh_token
                    
                    # Decode the JWT token
                    token_parts = access_token.split('.')
                    if len(token_parts) >= 2:
                        # Add padding if needed
                        payload_base64 = token_parts[1]
                        padding = len(payload_base64) % 4
                        if padding:
                            payload_base64 += '=' * (4 - padding)
                            
                        # Decode the payload
                        payload = json.loads(base64.b64decode(payload_base64).decode('utf-8'))
                        
                        # Get the user profile using the token
                        aud = payload.get('aud')
                        user_profile_url = f"{aud}{os.getenv('API_BASE_PATH')}/people/@self"
                        
                        profile_req = urllib.request.Request(user_profile_url)
                        profile_req.add_header('Authorization', f'Bearer {access_token}')
                        
                        with urllib.request.urlopen(profile_req) as profile_response:
                            profile_data = json.loads(profile_response.read().decode('utf-8'))
                            user = profile_data.get('response', {})
                            
                            # Send the user data as response
                            self.send_response(200)
                            self.send_header('Content-type', 'application/json')
                            
                            # Set token cookies
                            for morsel in cookie.values():
                                self.send_header('Set-Cookie', morsel.OutputString())
                                
                            self.end_headers()
                            self.wfile.write(json.dumps(user, indent=2).encode('utf-8'))
                            return
            
            except Exception as e:
                # Handle errors
                print(f"Error during token exchange: {str(e)}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
                return
        
        # If code is not in query parameters or other error
        self.send_response(400)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': 'Invalid callback request'}).encode('utf-8'))


def main():
    """Start the web server"""
    # Change to the directory of the script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Set up the HTTP server
    handler = DocSpaceOAuthHandler
    httpd = socketserver.TCPServer(("", PORT), handler)
    
    print(f"Server running at http://localhost:{PORT}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
