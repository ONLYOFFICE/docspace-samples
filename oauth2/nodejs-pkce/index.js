/**
 * DocSpace OAuth 2.0 Demo Application
 *
 * This application demonstrates the OAuth 2.0 authorization code flow with DocSpace.
 * It shows how to authenticate a user, get access tokens, and retrieve user profile information.
 */

// Load environment variables from .env file
require("dotenv").config();
// Express.js for web server functionality
const express = require("express");
// Axios for making HTTP requests
const axios = require("axios");
// Parse request bodies
const bodyParser = require("body-parser");
// File path utilities
const path = require("path");
// Cross-origin resource sharing
const cors = require("cors");
// Crypto for PKCE code generation
const crypto = require("crypto");

// Initialize Express application
const app = express();
// Set the port from environment variables or default to 3000
const PORT = process.env.PORT || 3000;

let code_verifier = "";

/**
 * Generate PKCE (Proof Key for Code Exchange) pair
 * Returns a code verifier and code challenge for secure OAuth authorization
 */
function generatePKCEPair() {
  // Generate a random string for the code verifier (between 43 and 128 characters)
  const verifier = crypto.randomBytes(32).toString("base64url");

  // Create the code challenge by hashing the verifier with SHA-256
  // and encoding it as base64url
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return { verifier, challenge };
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve files in the ./static folder.
app.use(express.static("static"));

// Enable CORS and assume the allowed origin is the redirect URI.
// i.e., this assumes that your client shares the same domain as the server.
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

/**
 * Root endpoint
 * Serves the main HTML page with the "Sign in with DocSpace" button
 */
app.route("/").get((req, res) => {
  res.sendFile(path.join(__dirname, "/static/index.html"));
});

/**
 * Authentication endpoint
 * Initiates the OAuth 2.0 flow by redirecting to DocSpace's authorization endpoint
 * Uses parameters from .env file:
 * - API_BASE_URL: Base URL for the DocSpace API
 * - RESPONSE_TYPE: OAuth response type (code for authorization code flow)
 * - CLIENT_ID: The OAuth client ID
 * - REDIRECT_URI: Where to redirect after authorization
 * - CLIENT_SCOPES: Requested permission scopes, URL-encoded
 */
app.route("/authenticate").get((req, res) => {
  // Generate PKCE pair
  const { verifier, challenge } = generatePKCEPair();

  code_verifier = verifier;

  // Redirect to the authorization endpoint with the code challenge
  res.redirect(
    `${process.env.API_BASE_URL}/oauth2/authorize?response_type=${process.env.RESPONSE_TYPE}&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=${process.env.CLIENT_SCOPES}&code_challenge=${challenge}&code_challenge_method=S256`
  );
});

/**
 * OAuth callback endpoint
 * This is where DocSpace redirects after user authorizes the application
 * It handles the OAuth token exchange:
 * 1. Receives the authorization code from the query string
 * 2. Exchanges the code for access and refresh tokens
 * 3. Decodes the JWT token to extract information
 * 4. Fetches the user profile using the access token
 */
app.route("/callback").get(async (req, res) => {
  // Extract the authorization code from the query parameters
  const code = req.query.code;

  // Prepare the token request body with required OAuth parameters
  const body = new URLSearchParams();
  body.append("client_id", process.env.CLIENT_ID);
  body.append("code_verifier", code_verifier);
  body.append("code", code);
  body.append("redirect_uri", process.env.REDIRECT_URI);
  body.append("grant_type", "authorization_code");

  // Request access and refresh tokens by sending the authorization code to the token endpoint
  const response = await axios.post(
    `${process.env.API_BASE_URL}/oauth2/token`,
    body
  );

  // Extract the response data containing tokens
  const data = response.data;

  // Extract the access token and refresh token from response
  const { access_token, refresh_token } = data;

  // Store tokens in cookies for future API requests
  res.cookie("token", access_token);
  res.cookie("refresh_token", refresh_token);

  // The JWT token is already encoded - we just need to decode it
  // Split the token to get the payload part (second part of JWT)
  const tokenParts = access_token.split(".");
  // The payload is the second part of the JWT
  const payloadBase64 = tokenParts[1];
  // Base64 decode the payload
  const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());

  // Extract the audience (API base URL) from the token payload
  const { aud } = payload;

  // Make a request to the DocSpace API to get the user's profile
  // Uses the access token for authorization
  const userResponse = await axios.get(
    `${aud}${process.env.API_BASE_PATH}/people/@self`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  // Extract the user profile information from the API response
  const user = userResponse.data.response;

  // Send the user profile information as the response
  // This includes name, email, avatar, and other user details
  res.send(user);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
