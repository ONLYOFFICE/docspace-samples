# DocSpace OAuth 2.0 Samples

This repository contains sample applications demonstrating OAuth 2.0 integration with ONLYOFFICE DocSpace. These samples show how to implement user authentication, obtain access tokens, and retrieve user profile information.

## Available Implementations

The repository includes the following implementations:

- **Python**: Standard OAuth 2.0 authorization code flow
- **Python-PKCE**: OAuth 2.0 with PKCE (Proof Key for Code Exchange) extension for additional security
- **NodeJS**: Standard OAuth 2.0 authorization code flow using Express
- **NodeJS-PKCE**: OAuth 2.0 with PKCE using Express

## What is OAuth 2.0?

OAuth 2.0 is an industry-standard authorization protocol that allows third-party applications to access user resources without exposing user credentials. In these samples, we demonstrate how to:

1. Redirect users to DocSpace for authentication
2. Handle the callback with an authorization code
3. Exchange the code for access and refresh tokens
4. Use the access token to retrieve user information

## What is PKCE?

PKCE (Proof Key for Code Exchange) is an extension to OAuth 2.0 designed to protect against authorization code interception attacks. It's particularly useful for applications that can't securely store a client secret, such as single-page applications or mobile apps.

## Prerequisites

- DocSpace account
- Client ID and Secret from DocSpace (obtained by registering your application)
- Web server capable of running Python or NodeJS or any other language

## Setup Instructions

### 1. Register Your Application in DocSpace

1. Log in to your DocSpace account as an administrator
2. Navigate to Developer Tools > OAuth2
3. Create a new application
4. Set the redirect URI to `http://localhost:3000/callback` (or your custom URI)
5. Open the application settings
6. Note the provided Client ID and Client Secret

### 2. Configuration

Each implementation requires setting up environment variables. Create a `.env` file in the root directory of each sample with the following variables:

```
API_BASE_URL=https://oauth.onlyoffice.com
API_BASE_PATH=/api/2.0
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
PORT=3000
REDIRECT_URI=http://localhost:3000/callback
RESPONSE_TYPE=code
CLIENT_SCOPES=your_client_scopes
```

### 3. Running the Samples

#### Python Implementation

```bash
cd python
python app.py
```

#### NodeJS Implementation

```bash
cd nodejs
npm install
npm start
```

## OAuth 2.0 Authorization Flow

These samples implement the following flow:

1. User initiates authentication by clicking the login button
2. Application redirects to DocSpace's authorization endpoint
3. User authenticates with DocSpace credentials
4. DocSpace redirects back to the application with an authorization code
5. Application exchanges the code for access and refresh tokens
6. Application uses the access token to fetch user information

## PKCE Flow Differences

The PKCE implementations add these additional security measures:

1. Generation of a code verifier (random string)
2. Creation of a code challenge derived from the verifier
3. Sending the code challenge during the authorization request
4. Including the original code verifier when exchanging the authorization code
