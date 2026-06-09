# whatsyourpurpose Reboot Plan

## Context

The project is a vanilla JS single-page app with a working feature set (JWT auth, device fingerprinting, multi-step purpose wizard, OpenAI generation). The structure is already flat — no monorepo to undo. The problems are:

- No bundler: frontend files are served as raw static assets via `vercel.json builds` (old v2 format)
- No TypeScript anywhere: 18 frontend files + 10 API files + 1 script, all plain JS
- No linting or formatting
- `vercel.json` uses the deprecated `builds` + `rewrites` config
- `@vercel/node` is v2.5 (latest is v5)
- `auth-token-verify.js` has a broken import path (`'../middleware/userAuth'` — file doesn't exist at that path)

**Goal:** Modernize tooling while keeping all existing functionality identical. No feature changes.

---

## Current Structure (already flat — no Phase 1 needed)

```
whatsyourpurpose/
├── index.html              # Single entry point, loads /src/app.js
├── src/
│   ├── app.js              # App singleton, step orchestration
│   ├── constants.js        # REFLECTION_QUESTIONS array
│   ├── components/
│   │   ├── auth/           # UserSetup.js, AccountRecovery.js
│   │   ├── common/         # Footer.js, Modal.js, NavigationPanel.js, ThemeToggle.js
│   │   └── purpose/        # NeedsSelection.js, PurposeView.js, QuestionsForm.js,
│   │                       # SelectionComponent.js (base), StrengthsSelection.js,
│   │                       # SummaryView.js, ValuesSelection.js
│   ├── styles/
│   │   ├── main.css        # @imports all component CSS
│   │   └── components/     # 12 CSS files (auth/, common/, purpose/)
│   └── utils/
│       ├── authUtils.js    # fetchWithAuth, refreshAccessToken, getAccessToken
│       ├── deviceUtils.js  # generateDeviceFingerprint (Web Crypto)
│       └── userDataStore.js # Static class, localStorage CRUD for UserData
├── api/                    # 10 Vercel serverless functions (plain JS)
│   ├── auth-check-username.js
│   ├── auth-helpers.js     # hashAnswer, generateAuthResponse, createDeviceEntry
│   ├── auth-jwt.js         # generateAccessToken, generateRefreshToken, verify*
│   ├── auth-middleware.js  # createAuthMiddleware HOF, verifyUserToken export
│   ├── auth-recover.js
│   ├── auth-register.js
│   ├── auth-token-refresh.js
│   ├── auth-token-verify.js  ⚠ broken import path (fixed in Phase 4)
│   ├── generate-purpose.js # OpenAI gpt-4o call, prompt rotation
│   └── save-purpose.js
├── scripts/
│   └── setup-admin.js      # One-time KV admin setup, uses require-style imports
├── public/assets/          # Static images
├── docs/                   # Architecture docs
├── package.json
├── vercel.json
└── CLAUDE.md
```

---

## Phases

### Phase 0 — Git Checkpoint

```bash
git add -A && git commit -m "chore: checkpoint before tooling reboot"
```

---

### Phase 1 — Vite + tsconfig

This is the foundation. Everything else builds on it.

**Update `package.json`** — replace scripts, bump `@vercel/node`, add all dev deps:

```json
{
  "name": "whats-your-purpose",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": "20.x" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src/ api/ vite.config.ts",
    "format": "prettier --write src/ api/ scripts/ vite.config.ts *.json",
    "setup-admin": "tsx scripts/setup-admin.ts"
  },
  "dependencies": {
    "@vercel/kv": "^0.2.4",
    "jsonwebtoken": "^9.0.2",
    "openai": "^4.77.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^20.0.0",
    "@vercel/node": "^5.0.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^10.0.0",
    "jiti": "^2.0.0",
    "prettier": "^3.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.0",
    "typescript-eslint": "^8.0.0",
    "vite": "^6.0.0"
  }
}
```

Notes:
- `ws` removed — it's in current deps but not used in any source file
- `concurrently` removed — `npm run dev` (Vite) replaces `vercel dev` for frontend HMR; `npx vercel dev` used when you need API functions
- `@vercel/node` moved to devDependencies (it's a type/runtime dep, not a runtime bundle dep)
- `@types/jsonwebtoken` needed for JWT types in API

**Create root `tsconfig.json`** (frontend + vite config):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["node_modules", "dist", "api", "scripts"]
}
```

**Create `scripts/tsconfig.json`** (scripts use CommonJS + dotenv):

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "rootDir": "."
  },
  "include": ["./*.ts"]
}
```

**Create `vite.config.ts`** — minimal, no template injection needed (single `index.html`):

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
```

**Update `index.html`** — change script src from `/src/app.js` to `/src/app.ts`:

```html
<script type="module" src="/src/app.ts"></script>
```

Vite resolves `.ts` files directly. The CSS link (`/src/styles/main.css`) stays as-is — Vite serves it from `src/` during dev and bundles it for prod.

**Install and verify:**

```bash
npm install
npm run build
# Should produce dist/index.html + bundled assets
npm run dev
# Should serve at localhost:5173
```

---

### Phase 2 — Shared Type Definitions

Create two type files before converting any source. This makes the subsequent conversions mechanical.

**Create `src/types.ts`** — all frontend shared types:

```typescript
export interface UserData {
  values: string[]
  strengths: string[]
  reflectionAnswers: string[]
  needs: string[]
  purposeStatement: string | null
  readyToGeneratePurpose: boolean
  lastUpdated: string | null
  needsNewPurpose: boolean
  lastUsedPromptIndex: number
  theme: 'dark' | 'light'
}

export interface AuthData {
  accessToken: string
  refreshToken: string
  userId: string
  username: string
}

export interface ModalButton {
  text: string
  type?: string
  onClick: () => void
}

export interface ModalOptions {
  title: string
  message: string
  buttons: ModalButton[]
}

export interface SelectionComponentConfig {
  containerId: string
  itemClass: string
  dataKey: string
  nextSection: string
  title: string
  subtitle: string
  items?: string[]
  maxSelections?: number
}

export interface GeneratePurposeResponse {
  purposeStatement: string
  promptIndex: number
}
```

**Create `api/types.ts`** — API-layer shared types (cannot import from `src/` at Vercel runtime):

```typescript
import type { VercelRequest } from '@vercel/node'

export interface JWTPayload {
  userId: string
  username: string
  deviceId: string | null
  deviceTrusted: boolean
  currentStreak?: number
  lastActive: string
}

export interface DeviceEntry {
  deviceId: string
  fingerprint: string
  lastUsed: string   // stored as ISO string in KV
  trusted: boolean
}

export interface UserMetadata {
  userId: string
  username: string
  lastActive: string
  joinDate: string
  recoveryHash: string
  devices: DeviceEntry[]
}

export interface PurposeData {
  userId: string
  statement: string
  updatedAt: string
}

// Augment VercelRequest to include decoded token attached by middleware
export interface AuthenticatedRequest extends VercelRequest {
  user: JWTPayload
}
```

---

### Phase 3 — Convert Frontend to TypeScript

Rename all files and add minimal annotations. Vite resolves `.js` extension imports to `.ts` automatically — **no import paths need changing**.

**Files to rename (18 total):**

```bash
# utils
mv src/utils/authUtils.js      src/utils/authUtils.ts
mv src/utils/deviceUtils.js    src/utils/deviceUtils.ts
mv src/utils/userDataStore.js  src/utils/userDataStore.ts

# constants
mv src/constants.js            src/constants.ts

# components/common
mv src/components/common/Footer.js          src/components/common/Footer.ts
mv src/components/common/Modal.js           src/components/common/Modal.ts
mv src/components/common/NavigationPanel.js src/components/common/NavigationPanel.ts
mv src/components/common/ThemeToggle.js     src/components/common/ThemeToggle.ts

# components/auth
mv src/components/auth/UserSetup.js         src/components/auth/UserSetup.ts
mv src/components/auth/AccountRecovery.js   src/components/auth/AccountRecovery.ts

# components/purpose
mv src/components/purpose/SelectionComponent.js  src/components/purpose/SelectionComponent.ts
mv src/components/purpose/ValuesSelection.js     src/components/purpose/ValuesSelection.ts
mv src/components/purpose/StrengthsSelection.js  src/components/purpose/StrengthsSelection.ts
mv src/components/purpose/QuestionsForm.js       src/components/purpose/QuestionsForm.ts
mv src/components/purpose/NeedsSelection.js      src/components/purpose/NeedsSelection.ts
mv src/components/purpose/SummaryView.js         src/components/purpose/SummaryView.ts
mv src/components/purpose/PurposeView.js         src/components/purpose/PurposeView.ts

# app
mv src/app.js src/app.ts
```

**Key annotations per file:**

`src/constants.ts`:
```typescript
export const REFLECTION_QUESTIONS: readonly string[] = [ ... ]
```

`src/utils/userDataStore.ts`:
- Import `UserData` from `'../types.js'`
- `getDefaultData(): UserData`
- All static methods typed with `UserData` param/return
- `getData(): UserData`, `updateData(partial: Partial<UserData>): void`

`src/utils/authUtils.ts`:
- Import `AuthData` from `'../types.js'`
- `refreshAccessToken(): Promise<boolean>`
- `fetchWithAuth(url: string, options?: RequestInit): Promise<Response>`
- `getAccessToken(): Promise<string>`
- `localStorage.getItem()` returns `string | null` — add null-check before `JSON.parse`

`src/utils/deviceUtils.ts`:
- `generateDeviceFingerprint(): Promise<string>`

`src/components/common/Modal.ts`:
- Import `ModalOptions` from `'../../types.js'`
- `show(options: ModalOptions): void`

`src/components/common/NavigationPanel.ts`:
- Import `UserData` from `'../../types.js'`
- `updateCallback` param: `(data: Partial<UserData>) => void`
- Dynamic component method calls: use `as any` where component types are circular

`src/components/purpose/SelectionComponent.ts`:
- Import `SelectionComponentConfig`, `UserData` from `'../../types.js'`
- Constructor: `constructor(config: SelectionComponentConfig)`
- `getSelected(): Set<string>`
- `hasUnsavedChanges(): boolean`
- `dataField` access: `(this.userData as any)[this.dataField]` — document why

`src/components/purpose/NeedsSelection.ts`:
```typescript
type NeedsCategories = {
  'Sustainable Development Goals': string[]
  'Worldly Needs': Record<string, string[]>
}
```

`src/app.ts`:
- Import `UserData` from `'./types.js'`
- `userData: UserData | null = null`
- Component map uses `Record<string, any>` for the mixed component types
- `currentStep` as string union type

**After renaming, update `index.html`:**
```html
<script type="module" src="/src/app.ts"></script>
```

**Verify:**
```bash
npm run build
# All 18 .ts files should compile without errors
```

---

### Phase 4 — Convert API to TypeScript

**Files to rename (10 total):**

```bash
mv api/auth-check-username.js  api/auth-check-username.ts
mv api/auth-helpers.js         api/auth-helpers.ts
mv api/auth-jwt.js             api/auth-jwt.ts
mv api/auth-middleware.js      api/auth-middleware.ts
mv api/auth-recover.js         api/auth-recover.ts
mv api/auth-register.js        api/auth-register.ts
mv api/auth-token-refresh.js   api/auth-token-refresh.ts
mv api/auth-token-verify.js    api/auth-token-verify.ts
mv api/generate-purpose.js     api/generate-purpose.ts
mv api/save-purpose.js         api/save-purpose.ts
```

**Fix the broken import in `api/auth-token-verify.ts`** — this is the one existing bug, fix it during conversion:

```typescript
// Before (broken):
import { verifyUserToken } from '../middleware/userAuth';
// After (fixed):
import { verifyUserToken } from './auth-middleware.js';
```

**Key annotations per file:**

`api/types.ts` (already created in Phase 2):
- All API files import shared types from `'./types.js'`

`api/auth-jwt.ts`:
```typescript
import jwt from 'jsonwebtoken'
import type { JWTPayload } from './types.js'

export function generateAccessToken(user: JWTPayload): string
export function generateRefreshToken(user: Pick<JWTPayload, 'userId' | 'deviceId'>): string
export function verifyAccessToken(token: string): JWTPayload
export function verifyRefreshToken(token: string): Pick<JWTPayload, 'userId' | 'deviceId'>
```
- Custom error class: `class TokenError extends Error { code: string }`

`api/auth-helpers.ts`:
```typescript
import type { DeviceEntry, UserMetadata, JWTPayload } from './types.js'

export function hashAnswer(answer: string): string
export function generateAuthResponse(userData: UserMetadata, deviceId: string): { ... }
export function createDeviceEntry(deviceId: string, fingerprint: string): DeviceEntry
```

`api/auth-middleware.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { JWTPayload } from './types.js'

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>
type WrappedHandler = (req: VercelRequest & { user?: JWTPayload }, res: VercelResponse) => Promise<void>

export function createAuthMiddleware(
  verifyToken: (token: string) => JWTPayload,
  type?: string
): (handler: Handler) => WrappedHandler
```
- Dynamic property assignment `req[type.toLowerCase()] = decoded` needs `(req as any)[...]`

`api/auth-check-username.ts` / `auth-register.ts` / `auth-recover.ts` / `auth-token-refresh.ts` / `auth-token-verify.ts` / `save-purpose.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void>
```

`api/generate-purpose.ts`:
```typescript
type PromptTemplate = (userData: UserPurposeData) => string
const PROMPT_TEMPLATES: PromptTemplate[] = [ ... ]
```
Where `UserPurposeData` is a local interface for the request body shape:
```typescript
interface UserPurposeData {
  values: string[]
  strengths: string[]
  reflectionAnswers: string[]
  needs: string[]
  lastUsedPromptIndex?: number
}
```

**Verify:**
```bash
npx vercel dev
# Test: POST /api/auth-register, POST /api/auth-token-refresh,
#       POST /api/generate-purpose (needs auth), GET /api/auth-token-verify
```

---

### Phase 5 — Convert Script to TypeScript

```bash
mv scripts/setup-admin.js scripts/setup-admin.ts
```

**`scripts/setup-admin.ts`** annotations:
```typescript
import { kv } from '@vercel/kv'
import crypto from 'crypto'
import { config } from 'dotenv'

interface AdminUser {
  username: string
  secretHash: string
  permissions: string[]
  createdAt: string
  lastLogin: string | null
}
```

Note: `dotenv` is used here but not in `package.json`. Add it:
```bash
npm install --save-dev dotenv @types/dotenv
```

---

### Phase 6 — ESLint + Prettier

**Install:**
```bash
npm install --save-dev eslint @eslint/js typescript-eslint prettier eslint-config-prettier jiti
```
(`jiti` required for ESLint to load TypeScript config file)

**Create `eslint.config.ts`:**
```typescript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  { ignores: ['dist/**', 'node_modules/**'] }
)
```

**Inspect code style first** (check existing files for semicolons/quotes/indent), then **create `.prettierrc`**:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "es5",
  "printWidth": 100
}
```
(Adjust `semi`/`tabWidth` after inspecting actual code style in existing files.)

**Create `.prettierignore`:**
```
dist/
node_modules/
public/assets/
```

**Run format to establish baseline:**
```bash
npm run format
# Commit separately: "style: apply prettier formatting"
```

**Run lint and fix any errors:**
```bash
npm run lint
# Common issues after TS conversion: unused vars, `any` types, missing return types
# Use `any` explicitly where needed — strict typing is a follow-up
```

---

### Phase 7 — Update vercel.json

**Current** (deprecated `builds` + `rewrites`):
```json
{
  "version": 2,
  "builds": [ ... ],
  "rewrites": [ ... ],
  "headers": [ ... ]
}
```

**New** (modern `functions` + `routes`):
```json
{
  "outputDirectory": "dist",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "vite --port $PORT",
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "handle": "filesystem" }
  ],
  "functions": {
    "api/*.ts": { "runtime": "@vercel/node" }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

Notes:
- Drop the WebSocket headers (`Upgrade`, `Connection`) — Vercel serverless doesn't support persistent WebSockets; these headers were non-functional
- Drop `"Connection": "Upgrade"` from Access-Control headers — not needed for REST API
- The `/assets/(.*)` → `/public/assets/$1` rewrite is no longer needed; Vite copies `public/` to `dist/` root, so `/assets/image.png` resolves correctly

---

### Phase 8 — Update CLAUDE.md + README

**CLAUDE.md** updates:
- **Commands:** `npm run dev` (Vite, HMR at localhost:5173), `npx vercel dev` (full stack with API), `npm run build`, `npm run lint`, `npm run format`, `npm run setup-admin`
- **Architecture:** Note TypeScript throughout, Vite bundler, remove "no bundler" note
- **Frontend:** Update file extensions to `.ts`, note `src/types.ts` for shared frontend types
- **Backend:** Note `api/types.ts` for shared API types, `api/*.ts` compiled by Vercel
- **Environment variables:** Add note about `dotenv` for scripts

**README:** Full rewrite to match current state (similar scope to bananaRodeo README update).

---

### Phase 9 — Final Verification

```bash
npm run build       # clean Vite build
npm run lint        # no errors
npx vercel dev      # all API endpoints respond
npx vercel          # preview deployment
```

Smoke test checklist on preview URL:
- [ ] App loads, auth gate shows
- [ ] Username registration works
- [ ] Values/Strengths/Questions/Needs steps complete
- [ ] Purpose generation calls OpenAI and returns statement
- [ ] Token refresh works (wait for expiry or manually test)
- [ ] Account recovery flow works
- [ ] Theme toggle persists

---

## Files to Create
- `vite.config.ts`
- `tsconfig.json`
- `src/types.ts`
- `api/types.ts`
- `eslint.config.ts`
- `.prettierrc`
- `.prettierignore`
- `scripts/tsconfig.json`

## Files to Rename (28 total)
| From | To |
|---|---|
| `src/app.js` | `src/app.ts` |
| `src/constants.js` | `src/constants.ts` |
| `src/utils/authUtils.js` | `src/utils/authUtils.ts` |
| `src/utils/deviceUtils.js` | `src/utils/deviceUtils.ts` |
| `src/utils/userDataStore.js` | `src/utils/userDataStore.ts` |
| `src/components/auth/UserSetup.js` | `src/components/auth/UserSetup.ts` |
| `src/components/auth/AccountRecovery.js` | `src/components/auth/AccountRecovery.ts` |
| `src/components/common/Footer.js` | `src/components/common/Footer.ts` |
| `src/components/common/Modal.js` | `src/components/common/Modal.ts` |
| `src/components/common/NavigationPanel.js` | `src/components/common/NavigationPanel.ts` |
| `src/components/common/ThemeToggle.js` | `src/components/common/ThemeToggle.ts` |
| `src/components/purpose/SelectionComponent.js` | `src/components/purpose/SelectionComponent.ts` |
| `src/components/purpose/ValuesSelection.js` | `src/components/purpose/ValuesSelection.ts` |
| `src/components/purpose/StrengthsSelection.js` | `src/components/purpose/StrengthsSelection.ts` |
| `src/components/purpose/QuestionsForm.js` | `src/components/purpose/QuestionsForm.ts` |
| `src/components/purpose/NeedsSelection.js` | `src/components/purpose/NeedsSelection.ts` |
| `src/components/purpose/SummaryView.js` | `src/components/purpose/SummaryView.ts` |
| `src/components/purpose/PurposeView.js` | `src/components/purpose/PurposeView.ts` |
| `api/auth-check-username.js` | `api/auth-check-username.ts` |
| `api/auth-helpers.js` | `api/auth-helpers.ts` |
| `api/auth-jwt.js` | `api/auth-jwt.ts` |
| `api/auth-middleware.js` | `api/auth-middleware.ts` |
| `api/auth-recover.js` | `api/auth-recover.ts` |
| `api/auth-register.js` | `api/auth-register.ts` |
| `api/auth-token-refresh.js` | `api/auth-token-refresh.ts` |
| `api/auth-token-verify.js` | `api/auth-token-verify.ts` |
| `api/generate-purpose.js` | `api/generate-purpose.ts` |
| `api/save-purpose.js` | `api/save-purpose.ts` |
| `scripts/setup-admin.js` | `scripts/setup-admin.ts` |

## Bug Fixed During Conversion
- `api/auth-token-verify.ts`: broken import `'../middleware/userAuth'` → `'./auth-middleware.js'`

## Key Risks

### TypeScript Strictness in Frontend Components
The component pattern uses dynamic property access (`req[type]`, `userData[this.dataField]`) and a component registry (`this.components[componentName]`). These legitimately need `as any` in places — that's acceptable. Don't spend time building elaborate generics; explicit `any` with a comment is fine.

### API Middleware Type Augmentation
`createAuthMiddleware` mutates `req` by adding `req.user`. VercelRequest doesn't have a `user` field. The `AuthenticatedRequest` interface in `api/types.ts` solves this — protected handlers should accept `AuthenticatedRequest` rather than `VercelRequest`.

### vercel.json Routes for SPA
The current `vercel.json` has no fallback-to-index route for SPA deep links (e.g., no `"src": "/(.*)", "dest": "/index.html"`). This wasn't there before, so don't add it — just preserve existing behavior.

## Phase Order & Deployability

| Phase | Deployable? |
|---|---|
| 0 — checkpoint | Yes |
| 1 — Vite + tsconfig | Yes (frontend only; API still works via vercel dev) |
| 2 — type files | Yes (new files, nothing broken) |
| 3 — frontend TS | Yes |
| 4 — API TS | Yes (+ fixes the auth-token-verify bug) |
| 5 — scripts TS | Yes |
| 6 — ESLint/Prettier | Yes |
| 7 — vercel.json | Yes |
| 8 — docs | Yes |
| 9 — deploy | Yes |
