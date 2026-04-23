# Code Review TODOs

Issues surfaced during review of `quick-refactor` branch. Fixed items removed from this list.

---

## Open

_All items from the post-reboot review are resolved. Further items surfaced during subsequent reviews go here._

---

## Fixed

- [x] **`app.ts` — document side-effect imports**
  Switched to bare side-effect imports (`import './components/common/ThemeToggle.js'` etc.) with a comment explaining the pattern. Removed the `void X` suppression block.

- [x] **`NavigationPanel.ts` — null-guard `this.data` before spread**
  Added `if (!this.updateCallback || !this.data) return` before the spread at the end of `handleNavItemClick`.

- [x] **`authUtils.ts` — handle non-JSON 401 responses**
  `response.clone().json()` is wrapped in try/catch; non-JSON 401s fall through as non-TOKEN_EXPIRED. Clone preserves the body for the caller.

- [x] **`Footer.ts` — replace `!` non-null assertions on DOM queries**
  `document.getElementById('app')!` replaced with a guard + console warning + early return. `QuestionsForm.ts` has no unguarded DOM-query `!`s (the `!` uses there are on class fields already narrowed by outer checks).

- [x] **`PurposeView.ts`, `generate-purpose.ts` — check `instanceof Error` before accessing `.message`**
  Both catch blocks now use `error instanceof Error ? error.message : String(error)` and conditional stack access.

- [x] **`UserDataStore.ts` — validate theme value from localStorage**
  `getTheme()` now returns `'light'` only when the stored value is exactly `'light'`; anything else (including corrupted/unknown values) resolves to `'dark'`.

- [x] **`SelectionComponent.ts` — replace `any` casts with typed field access**
  Added `SELECTION_FIELD_MAP` + `SelectionDataKey`/`SelectionDataField` literal unions in `src/types.ts`. `dataField` is now a typed `keyof UserData`, so `this.data[this.dataField]` is natively `string[]` — the three `(this.data as any)[this.dataField]` casts are gone.

- [x] **`generate-purpose.ts` — make `formatPrompt` non-mutating**
  `formatPrompt(userData, promptIndex)` is now pure. The handler computes `promptIndex` with `getNextPromptIndex()` and returns it directly in the response.

- [x] **`authUtils.ts` — validate `JSON.parse` results before casting**
  Added `isAuthData()` type guard and `loadAuthData()` helper. All four read sites now go through `loadAuthData()`, which returns `null` on parse errors or shape mismatches.

- [x] **`AccountRecovery.ts` — validate auth fields before constructing `AuthData`**
  Fields from `result` are now validated before the `AuthData` object is built.

- [x] **`NeedsSelection.ts` — guard `renderItems()` against unset `this.data`**
  Added explicit `if (!this.data) return ''` at the top of `renderItems()`.

- [x] **`UserSetup.ts` — `deviceId` always sent as `null`** *(fixed in quick-refactor)*
  Added `this.deviceId = crypto.randomUUID()` alongside `this.userId` generation before the registration request.

- [x] **`Modal.ts` — reviewed, not a real issue**
  `footer.innerHTML = ''` clears old buttons before new ones are created; no listener accumulation occurs.
