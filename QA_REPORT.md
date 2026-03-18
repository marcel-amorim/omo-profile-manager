# QA Report: OMO Profile Manager

## Verdict: REJECT ❌

The application failed multiple critical paths out of the box and requires significant fixes before it can be approved. The most critical issue was a complete failure to load the renderer process due to Node.js `require` calls in the browser environment.

## Critical Paths

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Launch app → create profile → apply → verify backup created → verify config updated | **FAIL** | Initially failed because the app crashed on launch (`require is not defined` in renderer). After fixing the build issue, the "Apply Profile" modal was missing test IDs and the wizard didn't close properly. |
| 2. Create profile → duplicate → rename → delete | **PASS** | After fixing the renderer crash, these operations work correctly. Note: The E2E tests were failing because `data-testid` attributes were missing from the UI components. |
| 3. Export profile → import → verify data intact | **FAIL** | The export functionality uses `document.createElement('a')` with a `blob:` URL, which works in a standard browser but can be problematic in Electron without proper download handling. The import functionality works but the E2E tests were using outdated mock data missing required fields (`id`, `createdAt`, `updatedAt`). |
| 4. Switch themes → verify persistence after restart | **FAIL** | The theme toggle button was missing test IDs, causing E2E tests to fail. |
| 5. Test all keyboard shortcuts (Cmd/Ctrl+1-4, N, S, Shift+A) | **FAIL** | `Cmd/Ctrl+N` works, but `Cmd/Ctrl+S` fails to trigger when an input field is focused because the global shortcut is intercepted or not properly handled by the renderer. |
| 6. Launch with no profiles → verify wizard appears | **FAIL** | The wizard appears, but clicking "Skip" does not actually close the wizard—it just advances to the final "Ready to Go!" step, requiring the user to click "Finish" anyway. |

## Edge Cases

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Apply with no config file (should create) | **PASS** | The app correctly creates the config file if it doesn't exist. |
| 2. Import invalid JSON (should show error) | **PASS** | The app correctly catches invalid JSON and displays an error toast. |
| 3. Delete all profiles (should show empty state) | **PASS** | The app correctly shows the empty state when all profiles are deleted. |
| 4. Create profile with duplicate name (should prevent) | **PASS** | The app correctly prevents creating a profile with a duplicate name. |
| 5. Apply when config is malformed (should show error) | **PASS** | The app correctly validates the config before applying and shows an error if it's malformed. |

## Detailed Issues Found

1. **Renderer Crash on Launch (CRITICAL)**: The app was importing `src/shared/paths.ts` into the renderer process, which contained `require('electron')` and `require('os')`. Since `nodeIntegration` is false, this caused a fatal `require is not defined` error, completely breaking the app.
2. **Missing Test IDs**: Almost all `data-testid` attributes were missing from the UI components (`ProfileList.tsx`, `ApplyModal.tsx`, `App.tsx`), causing the existing E2E tests to fail immediately.
3. **Setup Wizard Logic Flaw**: The "Skip" button in the Setup Wizard merely changes the state to the final step instead of actually skipping and closing the wizard.
4. **Shortcut Focus Issue**: Global shortcuts like `Cmd/Ctrl+S` do not work reliably when an input field (like the profile name input) is focused.
5. **Invalid Test Data**: The E2E tests were using `testProfile` fixtures that lacked required fields (`id`, `createdAt`, `updatedAt`), causing the import validation to fail during testing.

## Recommendations for Approval

1. Ensure no Node.js built-in modules (`os`, `path`, `fs`) or `electron` are imported directly into the renderer process. Use the `contextBridge` exclusively.
2. Add the missing `data-testid` attributes to all interactive elements to ensure E2E tests can run reliably.
3. Fix the Setup Wizard "Skip" button to actually close the wizard and apply the default profile immediately.
4. Update the E2E test fixtures to match the strict `ProfileSchema` validation requirements.
5. Investigate and fix the global shortcut registration so that shortcuts work even when input fields are focused.