# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: the implementation itself is likely small, but the full task will still exceed 5 tool uses once window config, splash assets, and relevant tests are inspected and then planned with validation steps. A `progress.md` file is therefore warranted.

## Requirements

- Remove the splash screen header bar so the splash window does not show standard minimise, maximise, or close controls.
- Keep the main app window behaviour unchanged.
- Preserve the existing splash-to-main startup flow.

## Captured from user request

- The current splash screen shows the same header bar as the main app.
- That presentation is unusual for a splash screen and should be removed.

## Research Findings

- Splash-specific files already exist in `static/splashscreen.html`, `src/lib/splashscreen.test.ts`, and `tests/e2e/specs/splashscreen.ts`.
- The main page closes the splash screen via `invoke("close_splashscreen")` from `src/routes/+page.svelte`.
- The splash window is created in Rust in `src-tauri/src/lib.rs`, using the `splashscreen` window label and `splashscreen.html`.
- The splash `WebviewWindowBuilder` currently sets `.title("screeny")`, `.inner_size(360.0, 240.0)`, `.resizable(false)`, `.center()`, and `.background_color(...)`, then builds the window.
- There is no existing splash-only window-chrome setting in that builder, so the default platform decorations remain enabled.
- The existing unit test file `src/lib/splashscreen.test.ts` only validates the static HTML/CSS content of `static/splashscreen.html`; it does not cover native window chrome.
- The existing E2E file `tests/e2e/specs/splashscreen.ts` checks that the splash window opens and renders content, but it does not currently assert that decorations or title-bar controls are absent.
- `src-tauri/tauri.conf.json` defines the main window (`label: "main"`) and does not define the splash window, so splash behaviour is not controlled by shared window config there.

## Key discoveries during exploration

- Window chrome is most likely controlled where the splash `WebviewWindowBuilder` is created in Rust, not in the HTML itself.
- Existing tests suggest the project already treats splash-screen behaviour as something worth asserting, so the change likely needs test updates or additions.
- Because the splash window is already non-resizable, removing decorations should be a narrow window-configuration change rather than a layout change.
- Current test coverage is split cleanly: HTML/CSS in SSR-style unit tests, and real splash-window behaviour in WebdriverIO E2E tests.
- The main window should remain untouched, because it is configured separately in `tauri.conf.json` and the user only wants the splash window changed.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Investigate Rust window builder first | Tauri window decorations are usually configured at window creation time. |
| Treat this as splash-only scope | The user asked to remove chrome from the splash screen, not to alter the main window. |
| Prefer an E2E assertion for the visual chrome change | Native window decorations are not meaningfully testable from the static splash HTML alone. |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| None yet | N/A |

## Resources

- `src-tauri/src/lib.rs`
- `static/splashscreen.html`
- `src/lib/splashscreen.test.ts`
- `tests/e2e/specs/splashscreen.ts`

## Visual/Browser Findings

- None.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
