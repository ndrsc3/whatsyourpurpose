# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Local development (Vite dev server at localhost:5173)
npm run dev

# Build (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Format
npm run format

# Setup admin user (requires KV + ADMIN_SECRET env vars)
npm run setup-admin
```

There is no test suite.

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

This is a TypeScript single-page app built with Vite, deployed on Vercel with serverless API functions.

**Frontend** (`src/`): No framework. TypeScript source compiled by Vite. Entry point: `index.html` → `/src/app.ts`.

**Backend** (`api/`): Vercel serverless functions (Node.js). Each `api/*.ts` file becomes an endpoint, compiled automatically by Vercel. Uses `@vercel/node` types. All files use ES module import/export syntax.

**Storage**: Vercel KV (Redis). User records at `user:{userId}`. Username→userId mapping at `userIndex`. Purpose data at `user:{userId}:purpose`. Active users set at `activeUsers`.

**Types**: `src/types.ts` for frontend types, `api/types.ts` for API types. These are separate files — API functions cannot import from `src/` at Vercel runtime.

### User Flow

The app is a multi-step wizard guiding users through purpose discovery:

1. **Auth** — Username-based registration (no password; fun security question for account recovery). Stores `appWMP_auth` (accessToken, refreshToken, userId, username) in localStorage.
2. **Values** — Select 10 core values
3. **Strengths** — Select 10 strengths
4. **Reflections** — Answer 4 open-ended questions
5. **Needs** — Select 10 human needs
6. **Summary** — Review selections
7. **Purpose** — AI-generated purpose statement (via OpenAI gpt-4o)

`App` in `src/app.ts` is a singleton that orchestrates step transitions. It calls `determineStep()` after each data update to decide which component to show. Progress is tracked by checking array lengths (e.g., `values.length === 10`).

User progress is stored in `localStorage` under `appWMP_userData` via `UserDataStore` (`src/utils/userDataStore.ts`). Client-side only — the backend stores auth metadata and purpose statements, not wizard progress.

### Auth System

- JWT access tokens (24h) + refresh tokens (30d), signed with separate secrets
- `fetchWithAuth` (`src/utils/authUtils.ts`) handles automatic token refresh on 401 with `code: TOKEN_EXPIRED`
- `verifyUserToken` middleware in `api/auth-middleware.ts` wraps protected handlers; attaches decoded token to `req.user`
- Device fingerprinting tracks trusted devices per user

### Component Pattern

Each component in `src/components/` follows a class-instance pattern with:
- `initialize(updateDataCallback, userId?)` — called once at app start
- `show()` / `hide()` — toggle visibility
- `setData(userData)` — receive updated data from App

Components render their own HTML into pre-existing DOM containers defined in `index.html`. CSS files in `src/styles/components/`.

**Selection components** (`ValuesSelection`, `StrengthsSelection`, `NeedsSelection`) extend `SelectionComponent` base class in `src/components/purpose/SelectionComponent.ts`.

### AI Integration

`/api/generate-purpose` calls OpenAI gpt-4o with one of 3 rotating prompt templates. `lastUsedPromptIndex` in user data cycles through framings on regeneration.

### Build System

Vite bundles everything. `public/` is served as static assets (fonts, images). The `index.html` at project root is the SPA entry point.
