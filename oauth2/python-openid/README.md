# DocSpace OAuth 2.0 with OpenID Connect - Python Sample

This sample application demonstrates how to implement OAuth 2.0 authentication with OpenID Connect using DocSpace. It showcases a complete implementation of the authorization code flow with additional user information retrieval via the OpenID userinfo endpoint.

## Overview

DocSpace supports the OpenID Connect protocol for authenticating DocSpace users with your applications. This allows your users to sign in to your application using their DocSpace accounts. The sample implements:

1. OAuth 2.0 authorization code flow
2. Access token and refresh token handling
3. JWT token decoding
4. User profile fetching via OpenID Connect userinfo endpoint

## How It Works

### Authorization Flow

1. User clicks "Sign in with DocSpace" button
2. User is redirected to DocSpace's authorization page
3. After granting permission, DocSpace redirects back with an authorization code
4. The application exchanges this code for access and refresh tokens
5. The application decodes the JWT token to extract user information
6. Additional user data is fetched from the userinfo endpoint

### Code Example

Here's how the OAuth authorization URL is constructed in Python:

```python
def handle_authenticate(self):
    """Handle the authentication request and redirect to DocSpace"""
    api_base_url = os.getenv('API_BASE_URL')
    response_type = os.getenv('RESPONSE_TYPE')
    client_id = os.getenv('CLIENT_ID')
    redirect_uri = os.getenv('REDIRECT_URI')
    client_scopes = os.getenv('CLIENT_SCOPES')

    # Build the authorization URL
    auth_url = f"{api_base_url}/oauth2/authorize?response_type={response_type}&client_id={client_id}&redirect_uri={redirect_uri}&scope={client_scopes}"

    # Redirect to the authorization endpoint
    self.send_response(302)
    self.send_header('Location', auth_url)
    self.end_headers()
```

## OpenID Connect Details

### UserInfo Endpoint

The sample demonstrates how to access additional user information through the standardized userinfo endpoint. This endpoint returns a JSON object with the user's identity information.

This is done by making a GET request to the userinfo endpoint with the access token:

```python
user_profile_url = f"{aud}{os.getenv('API_BASE_PATH')}/oauth2/userinfo"

profile_req = urllib.request.Request(user_profile_url)
profile_req.add_header('Authorization', f'Bearer {access_token}')

with urllib.request.urlopen(profile_req) as profile_response:
    profile_data = json.loads(profile_response.read().decode('utf-8'))
    user = profile_data
```

The response contains the following fields:

```json
{
  "sub": "66faa6e4-f133-11ea-b126-00ffeec8b4ef", // User ID
  "aud": ["http://192.168.0.197"], // Audience (API base URL)
  "nbf": 1745499926, // Not before timestamp
  "scope": ["openid"], // Granted scopes
  "iss": "http://192.168.0.197/oauth2", // Token issuer
  "exp": 1745503526, // Expiration timestamp
  "iat": 1745499926, // Issued at timestamp
  "jti": "efc90ecc-bbda-4bbb-a9cb-6a9cecb4ae48", // JWT ID
  "tid": 1, // Tenant ID
  "cid": "ce05cd8d-2844-47e8-a72e-cbb6141ebe97" // Client ID
}
```

For more details about DocSpace's OAuth implementation, refer to the [DocSpace API documentation](https://api.onlyoffice.com/docspace/).
