# Code Review TODOs

Issues surfaced during review of `quick-refactor` branch. Fixed items removed from this list.

---

## Open

### High

- [ ] **`SelectionComponent.ts` — replace `any` casts with typed field access**
  `(this.data as any)[this.dataField]` at lines 59, 76, 99. `dataField` is built by appending `'s'` to `dataKey` with no validation against actual `UserData` keys. Use a type-safe map or discriminated union instead.

- [ ] **`generate-purpose.ts` — make `formatPrompt` non-mutating**
  `formatPrompt()` sets `userData.lastUsedPromptIndex = nextIndex` inside what looks like a pure function. Extract the index separately and pass it back without mutating the input.

- [ ] **`authUtils.ts` — validate `JSON.parse` results before casting**
  `JSON.parse(raw) as AuthData` at multiple sites. Corrupted localStorage is cast blindly. Add a runtime shape check before trusting the result.

- [ ] **`AccountRecovery.ts` — validate auth fields before constructing `AuthData`**
  Fields are validated after the object is built. Flip the order: check `result.accessToken` etc. exist before constructing `AuthData`.

- [ ] **`NeedsSelection.ts` — guard `renderItems()` against unset `this.data`**
  The parent `render()` guards `this.data`, but the override accesses `this.data?.needs` inside template literals. Fragile if parent guards change. Add an explicit guard at the top of `renderItems()`.

### Medium

- [ ] **`app.ts` — document side-effect imports**
  `void ThemeToggle`, `void UserSetup`, etc. suppress unused-variable warnings for side-effect imports. Add a comment explaining the pattern, or restructure so imports don't require suppression.

- [ ] **`NavigationPanel.ts` — null-guard `this.data` before spread**
  Line 144: `this.updateCallback!({ ...this.data, ... })` — `this.data` is nullable but spread without a guard.

- [ ] **`authUtils.ts` — handle non-JSON 401 responses**
  In `fetchWithAuth`, `response.json()` on a 401 will throw if the response is not JSON (e.g. a proxy error). Wrap in try/catch and fall through to the original error.

- [ ] **`Footer.ts`, `QuestionsForm.ts` — replace `!` non-null assertions on DOM queries**
  Runtime crashes if HTML structure changes. Fail gracefully with early returns or logged warnings instead.

### Low

- [ ] **`PurposeView.ts` — check `instanceof Error` before accessing `.message`**
  `catch (error)` blocks cast to `Error` unconditionally. Thrown values may not be `Error` instances.

- [ ] **`ThemeToggle.ts` — validate theme value from localStorage**
  `UserDataStore.getTheme()` has a `'dark'` fallback, but explicitly validating the stored value against known theme strings would be more robust.

---

## Fixed

- [x] **`UserSetup.ts` — `deviceId` always sent as `null`** *(fixed in quick-refactor)*
  Added `this.deviceId = crypto.randomUUID()` alongside `this.userId` generation before the registration request.

- [x] **`Modal.ts` — reviewed, not a real issue**
  `footer.innerHTML = ''` clears old buttons before new ones are created; no listener accumulation occurs.
