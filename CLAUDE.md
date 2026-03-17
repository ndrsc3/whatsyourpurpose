# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Local development (requires Vercel CLI)
vercel dev

# Build
vercel build

# Deploy
vercel deploy
```

The dev server runs at `http://localhost:3000`. There is no test suite.

## Environment Variables

Create a `.env` file with:
```
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
JWT_SECRET=
REFRESH_SECRET=
OPENAI_API_KEY=
```

## Architecture

This is a vanilla JS single-page app deployed on Vercel with serverless API functions.

**Frontend** (`src/`): No framework, no bundler. Files are served as static assets directly via `vercel.json`. ES modules are used natively in the browser (`<script type="module" src="/src/app.js">`).

**Backend** (`api/`): Vercel serverless functions (Node.js). Each file in `api/` becomes an endpoint. The `vercel.json` rewrites `/api/auth-check-username` -> `/api/auth-check-username.js`.

**Storage**: Vercel KV (Redis) for user data. User records are stored at `user:{userId}`. A `userIndex` key maps lowercased usernames to userIDs. An `activeUsers` set tracks all user IDs.

### User Flow

The app is a multi-step wizard guiding users through purpose discovery:

1. **Auth** - Username-based registration (no password; uses a fun security question as recovery). Stores `appWMP_auth` (accessToken, refreshToken, userId) in localStorage.
2. **Values** - Select 10 core values
3. **Strengths** - Select 10 strengths
4. **Reflections** - Answer 4 open-ended questions
5. **Needs** - Select 10 human needs
6. **Summary** - Review selections
7. **Purpose** - AI-generated purpose statement (via OpenAI gpt-4o)

`App` in [src/app.js](src/app.js) is a singleton that orchestrates step transitions. It calls `determineStep()` after each data update to decide which component to show. Progress is tracked by checking array lengths (e.g., `values.length === 10`).

User progress is stored in `localStorage` under `appWMP_userData` via `UserDataStore` ([src/utils/userDataStore.js](src/utils/userDataStore.js)). This is client-side only — the backend only stores auth/user metadata, not purpose data.

### Auth System

- JWT access tokens (24h expiry) + refresh tokens (30d), both signed with separate secrets
- `fetchWithAuth` ([src/utils/authUtils.js](src/utils/authUtils.js)) handles automatic token refresh on 401 with `code: TOKEN_EXPIRED`
- `verifyUserToken` middleware in [api/auth-middleware.js](api/auth-middleware.js) wraps protected handlers; attaches decoded token to `req.user`
- Device fingerprinting is used to track trusted devices per user

### Component Pattern

Each component in `src/components/` follows a static class pattern with:
- `initialize(updateDataCallback, userId)` - called once at app start
- `show()` / `hide()` - toggle visibility
- `setData(userData)` - receive updated data from App

Components render their own HTML into pre-existing DOM containers defined in [index.html](index.html). Each component has a corresponding CSS file in `src/styles/components/`.

### AI Integration

`/api/generate-purpose` calls OpenAI gpt-4o with one of 3 rotating prompt templates. The `lastUsedPromptIndex` in user data tracks which prompt was last used so regenerations cycle through different framings.
