# Authentication System Overview

## 1. Token Types
There are two parallel authentication systems:

A. Regular User Authentication
- Access Token (24h expiry)
- Refresh Token (30d expiry)
- Device-based trust system

B. ToDo:: Admin Authentication
- Access Token (1h expiry)
- Refresh Token (7d expiry)
- Permission-based system

## 2. Authentication Flow

**Regular Users:**

A. Initial Authentication
- Username verification
- Device fingerprinting
- Recovery answer hashing
- Token pair generation

_These are stored in localStorage_ (Probably not secure)

B. Token Refresh
- Verifies refresh token
- Checks device trust status
- Generates new access token
- Updates last active timestamp

**Admin Users:**

A. Initial Authentication
Secret-based authentication
- Permission assignment
- Token pair generation

B. Token Refresh
- Similar to user refresh but includes permission checks

## Specific Flows

**A. Protected API Calls**
1. Client makes requests using `fetchWithAuth()` (`src/utils/authUtils.js`)
- Adds Bearer token to request headers
- Handles 401 errors and token refresh automatically

2. API routes are protected by middleware
- `baseAuth.js` provides the core authentication middleware
- `userAuth.js` and `adminAuth.js` extend this for different user types

3. If Token Expires
- Client attempts refresh via `refreshAccessToken()`
- Calls `/api/auth/token-refresh` endpoint
- New access token is stored in `localStorage`

**B. Token Refresh Flow**
- Receives refresh token
- Verifies refresh token validity
- Checks if user exists and device is trusted
- Generates new access token
- Updates user's last active timestamp

---

## Security Analysis

Strong Points:
1. Separate secrets for user and admin tokens
2. Device-based trust system
3. Permission-based admin access
4. Proper error handling and logging
5. Consistent token verification middleware

Potential Issues
1. Token Storage: The refresh tokens are stored in localStorage which could be vulnerable to XSS attacks. Consider using HTTP-only cookies instead.

2. Error Messages: Some error messages might be too detailed for production. Consider standardizing error responses, theres duplication in error  handling between components - this should be consolidated into central error handling.

3. Token Revocation: There's no clear mechanism for revoking refresh tokens. Consider implementing a token blacklist.

4. Device Trust: The device trust system could be strengthened by adding additional verification steps.
