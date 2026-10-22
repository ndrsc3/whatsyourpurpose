# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Local development — checks the setup (dev-check), then runs vercel dev. NOT npm run dev
npm run dev:full
npm run dev:check        # the checks alone: packages, Vercel link, .env.local keys, Node

# The gate: lint, test, build, smoke. CI runs exactly this; so does the pre-commit hook
npm run check

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

`npm test` runs `node:test` over `scripts/*.test.mjs` (the dev-check tests). `npm run smoke` compiles every `api/*.ts` as Vercel does and imports it under Node, catching a function that would 500 on load. `npm run typecheck` is not in `check` yet: `src/` has 8 existing errors (`docs/TASKS.md`).

**Node 24, not 25.** Production runs 24.x (`.nvmrc`, `engines`). `jsonwebtoken`'s dependency `buffer-equal-constant-time` uses `SlowBuffer`, which Node 25 removed, so on Node 25 every auth function fails to load: `vercel dev` auth breaks and the pre-commit hook's smoke check fails. Use Node 24 locally.

### Why `vercel dev` and not `npm run dev`

`npm run dev` runs Vite only — it serves the SPA but does NOT execute the serverless functions in `api/`. Every `/api/*` call returns 404 under plain Vite. The Vercel CLI dev server (`vercel dev`) runs both the static frontend and the `api/*.ts` handlers on one port, matching production behavior.

First-time setup on a machine:
```bash
npm install
npx vercel link --yes --project app-whatsyourpurpose   # links this directory to the deployed Vercel project
npx vercel env pull .env.local                         # pulls runtime secrets from Vercel into .env.local
```

After that, just `npm run dev:full` per session.

## Environment Variables

`.env.local` (gitignored) holds the runtime secrets the API functions read. Pull them from the linked Vercel project with `npx vercel env pull .env.local` rather than maintaining them by hand. The required keys are in `.env.example`, and `npm run dev:check` confirms each is set. `ADMIN_SECRET` is needed only for `npm run setup-admin`.

**There is no dev store.** Every environment, local and preview included, reads and writes the production KV, and every `generate-purpose` call spends real OpenAI credit. Don't run data-writing or generation tests against it. Add a second free Upstash database for Development + Preview before data-touching work (`docs/TASKS.md`).

## Git Workflow

**GitHub flow: every change is a short-lived branch and a PR into `main`. The PR's Vercel preview is the staging check.**

- **`main`** = production. A GitHub ruleset enforces it: changes arrive only by PR, CI `verify` must pass, the branch must be up to date with `main`, merge commits only, and `main` can't be force-pushed or deleted.
- **One branch per unit of work** (`feature/`, `fix/`, `chore/`), each in its own worktree: `git worktree add -b feature/X ../whatsyourpurpose-X origin/main`, then `ln -s ../whatsyourpurpose/node_modules node_modules` and `cp -R ../whatsyourpurpose/.vercel ../whatsyourpurpose/.env.local .` inside it. The main checkout stays on `main` and is never worked in.
- **Agents never merge without the owner's approval in chat.** Agent and owner share one GitHub account, so "reviewed" means that approval plus green CI.

1. **Commit.** The pre-commit hook runs `npm run check`. Never bypass it with `--no-verify`.
2. **Before pushing, `git fetch` and rebase onto `origin/main`** if it moved. Surface conflicts; don't force-resolve.
3. **Push and open a PR into `main`.** Keep branches short-lived.
4. **CI `verify` and the Vercel preview run on the PR.** Check the change on the preview (previews are behind Vercel login).
5. **If GitHub says the branch is out of date:** `gh pr update-branch <n>`, or rebase and push. CI reruns.
6. **Owner approves in chat, then merge:** `gh pr merge <n> --merge`. GitHub deletes the remote branch.
7. **Verify production:** `https://whatsyourpurpose.vercel.app` returns 200 and `/api/auth-token-verify` returns 401 without a token.
8. **Clean up:** remove the worktree and local branch, and `git -C ../whatsyourpurpose pull --ff-only`.

**When a second developer joins:** the ruleset moves to 1 required approval, and a dev KV store goes in first.

## Architecture

This is a TypeScript single-page app built with Vite, deployed on Vercel with serverless API functions.

**Frontend** (`src/`): No framework. TypeScript source compiled by Vite. Entry point: `index.html` → `/src/app.ts`.

**Backend** (`api/`): Vercel serverless functions (Node.js). Each `api/*.ts` file becomes an endpoint, compiled automatically by Vercel. Uses `@vercel/node` types. All files use ES module import/export syntax.

**Storage**: Vercel KV (Redis). User records at `user:{userId}`. Username→userId mapping at `userIndex`. Purpose data at `user:{userId}:purpose`. Active users set at `activeUsers`.

**Keep-alive:** `api/keepalive.ts` runs as a daily Vercel cron (`vercel.json` `crons`) and writes `keepalive:last`. Upstash archives a free database after a stretch with no commands, and an archived store 500s every KV route until restored by hand; this happened in 261022. If `CRON_SECRET` is set in the project, only Vercel's cron call is accepted.

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
