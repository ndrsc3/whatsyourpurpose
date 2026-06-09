# What's Your Purpose — Task Board

<!-- [ ] todo  [~] in-progress  [x] done -->
<!-- scope tags: [FEATURE] [DX] [BUG] [REVIEW] -->

_Last touched: 260609_

---

## P1 — Ship blockers

_(none)_

---

## P2 — Next up

_(none)_

---

## P3 — Backlog

_(none)_

---

## Done

### Code review — `quick-refactor` branch (post-reboot)

_All review items resolved._

- [x] [REVIEW] **`app.ts` — document side-effect imports** — switched to bare side-effect imports (`import './components/common/ThemeToggle.js'` etc.) with a comment explaining the pattern. Removed the `void X` suppression block.
- [x] [REVIEW] **`NavigationPanel.ts` — null-guard `this.data` before spread** — added `if (!this.updateCallback || !this.data) return` before the spread at the end of `handleNavItemClick`.
- [x] [REVIEW] **`authUtils.ts` — handle non-JSON 401 responses** — `response.clone().json()` wrapped in try/catch; non-JSON 401s fall through as non-TOKEN_EXPIRED. Clone preserves the body for the caller.
- [x] [REVIEW] **`Footer.ts` — replace `!` non-null assertions on DOM queries** — `document.getElementById('app')!` replaced with a guard + console warning + early return. `QuestionsForm.ts` has no unguarded DOM-query `!`s.
- [x] [REVIEW] **`PurposeView.ts`, `generate-purpose.ts` — check `instanceof Error` before `.message`** — both catch blocks now use `error instanceof Error ? error.message : String(error)` and conditional stack access.
- [x] [REVIEW] **`UserDataStore.ts` — validate theme value from localStorage** — `getTheme()` returns `'light'` only when the stored value is exactly `'light'`; anything else resolves to `'dark'`.
- [x] [REVIEW] **`SelectionComponent.ts` — replace `any` casts with typed field access** — added `SELECTION_FIELD_MAP` + `SelectionDataKey`/`SelectionDataField` literal unions in `src/types.ts`. `dataField` is now a typed `keyof UserData`; the three `(this.data as any)[this.dataField]` casts are gone.
- [x] [REVIEW] **`generate-purpose.ts` — make `formatPrompt` non-mutating** — `formatPrompt(userData, promptIndex)` is now pure. The handler computes `promptIndex` with `getNextPromptIndex()` and returns it directly in the response.
- [x] [REVIEW] **`authUtils.ts` — validate `JSON.parse` results before casting** — added `isAuthData()` type guard and `loadAuthData()` helper. All four read sites go through `loadAuthData()`, which returns `null` on parse errors or shape mismatches.
- [x] [REVIEW] **`AccountRecovery.ts` — validate auth fields before constructing `AuthData`** — fields from `result` are validated before the `AuthData` object is built.
- [x] [REVIEW] **`NeedsSelection.ts` — guard `renderItems()` against unset `this.data`** — added explicit `if (!this.data) return ''` at the top of `renderItems()`.
- [x] [REVIEW] **`UserSetup.ts` — `deviceId` always sent as `null`** — added `this.deviceId = crypto.randomUUID()` alongside `this.userId` generation before the registration request.
- [x] [REVIEW] **`Modal.ts` — reviewed, not a real issue** — `footer.innerHTML = ''` clears old buttons before new ones are created; no listener accumulation occurs.
