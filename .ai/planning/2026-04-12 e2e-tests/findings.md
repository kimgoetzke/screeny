# Findings & Decisions

## Plan Size

**Multi-phase: Yes**
Reasoning: Adding full-stack E2E coverage will require new test tooling, app/test configuration, stable fixtures, selector/testability changes in the UI, and native-runner orchestration across the Svelte frontend and Tauri backend. This will likely touch well over 5 files, require well over 5 tool uses, and exceed 150 lines of change.

## Requirements

- Create a plan to add full-stack E2E tests for this application
- Read `CLAUDE.md` for a high-level product and architecture overview
- Focus on an approach suitable for this Tauri + Svelte + Rust desktop app

## Research Findings

- `CLAUDE.md` describes Screeny as a cross-platform GIF recorder/editor built with Tauri, Svelte + TypeScript, and Rust
- Interactive editing lives in the frontend; heavy file I/O and encode/decode live in Rust across a narrow IPC boundary
- The early product scope centres on Studio MVP flows: opening GIFs, frame edits, export, and project save/load
- Linux/Wayland is the must-have platform, so E2E planning likely needs to account for Linux-first execution constraints
- The planning template expects a phased plan with explicit status tracking, decision logging, and error logging
- The questions template requires a chronological Q/A log even when there are no open questions yet
- `package.json` has app build/check scripts and `vitest` as a dev dependency, but no existing `test` or E2E script
- `src-tauri/Cargo.toml` has only `tempfile` in Rust dev-dependencies and no current E2E-specific backend test harness
- The frontend source tree is small (`src/app.html`, `src/lib`, `src/routes`), suggesting current user-facing flows are concentrated rather than spread across many packages
- The Rust backend entry points live under `src-tauri/src` with `dialog.rs`, `gif/`, `lib.rs`, and `main.rs`, so full-stack E2E will likely need to exercise both web UI state and Tauri commands
- The app currently exposes a single route (`src/routes/+page.svelte`) rather than a multi-page flow, which makes scenario-based E2E coverage feasible from one main screen
- Tauri commands currently cover GIF decode/export and native file dialogs, which are exactly the cross-boundary behaviours an end-to-end test plan must account for or stub
- The main page simply composes `Toolbar`, `FrameViewer`, and `Timeline`, so those components are likely the primary UI surfaces for E2E scenarios
- `src/lib` already contains stores, actions, components, and at least one frontend unit test (`actions.test.ts`), which suggests E2E tests should complement existing lower-level tests rather than replace them
- Existing frontend tests cover `openGif` and `exportGif` by mocking dialog/backend interfaces, so current coverage stops below the real Tauri boundary
- `tauri.conf.json` starts the app via `pnpm dev` at `http://localhost:1420`, which is useful for browser-level tests but not sufficient alone for native Tauri end-to-end coverage
- `src/lib/actions.ts` keeps the UI-to-native interaction behind `DialogProvider` and `GifBackend` interfaces, which gives a clean seam for lower-level tests and hints that E2E tests should target the UI above this seam
- Tauri v2 docs recommend WebDriver-based end-to-end testing for native app coverage, distinct from mock-runtime unit/integration tests
- `Toolbar.svelte` is the current native boundary consumer: it invokes Tauri commands for open/export and shows status text, making it a strong first E2E target
- The frame store already has tests (`frames.test.ts`), so the missing coverage is the real user journey through toolbar, viewer, timeline, and backend commands together
- `FrameViewer.svelte` renders either an empty state or a real `<canvas>` for the selected frame, giving E2E tests a visible assertion point after import/open flows
- `Timeline.svelte` supports selection, delete, keyboard delete, and drag/drop reorder on frame thumbnails, so the first useful E2E suite can cover more than open/export alone
- The multi-phase `progress.md` template expects per-phase activity, touched files, test results, and a detailed error log
- The `task_plan.md` template matches `plan.md`, confirming the plan should be organised as explicit phases with decisions and errors tracked alongside them
- Tauri’s native E2E path uses `tauri-driver`, which wraps the platform WebDriver; desktop support is Linux and Windows, not macOS
- On Linux, native Tauri WebDriver runs require `WebKitWebDriver`, so the eventual implementation plan must include local/CI setup for that dependency
- Tauri also supports mocked IPC via `@tauri-apps/api/mocks`, which is useful to keep component/integration tests below E2E focused and fast
- Tauri’s public WebDriver example explicitly targets Linux and Windows and ships JS examples rather than Rust-only test harnesses, which fits this repo’s existing `pnpm` workflow
- The example repo exposes multiple client options (`selenium` and `webdriverio` variants in `v1`), so the plan should include selecting one Node-friendly WebDriver client instead of assuming browser-only tooling
- The user confirmed the first rollout should optimise for Linux/Wayland native Tauri
- The user chose a dedicated E2E mode that bypasses native file dialogs with deterministic fixture paths for the initial rollout

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| Start by inspecting existing JS and Rust test/build tooling before choosing an E2E framework | Full-stack E2E for Tauri depends on current runner support, app entry points, and CI/dev commands |
| Assume E2E coverage will need new tooling rather than wiring into an existing test runner | The repo currently exposes type-check/build tooling, but no end-to-end entry point |
| Plan for both browser-level and native-shell concerns | Current tests already mock the native boundary, but the app’s riskier paths include real Tauri command invocation and dialog interaction |
| Treat WebDriver-capable native tests as the target definition of “full-stack E2E” | Tauri’s own docs distinguish these from mock-runtime tests and browser-only checks |
| Start E2E scope with toolbar-driven open/export flows | Those flows cross the UI, store, IPC, and file system boundaries in one scenario |
| Include timeline manipulation in the planned scenario set | The current MVP already exposes meaningful user actions there, and they are lightly covered only below the UI level |
| Keep mocked IPC/unit tests in place and add native E2E above them | Tauri’s docs position mocking and WebDriver as complementary layers, not substitutes |
| Keep the native E2E runner in the Node toolchain | The upstream example is JS-oriented and this repo already uses pnpm/TypeScript on the frontend |
| Optimise the first E2E milestone for Linux/Wayland only | The user confirmed Linux-first scope and the project already treats Linux/Wayland as must-have |
| Use a dedicated E2E mode to bypass native file dialogs with deterministic paths | The user preferred reliability and determinism over automating platform dialogs in the first rollout |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
| Planning directory creation command hung unexpectedly | Stopped that shell; user confirmed the directory already exists, so continued without retrying the same action |

## Resources

- `/home/kgoe/projects/screeny/CLAUDE.md`
- `/home/kgoe/.copilot/skills/planning/templates/findings.md`
- `/home/kgoe/.copilot/skills/planning/templates/plan.md`
- `/home/kgoe/.copilot/skills/planning/templates/questions.md`
- `/home/kgoe/projects/screeny/package.json`
- `/home/kgoe/projects/screeny/src-tauri/Cargo.toml`
- `/home/kgoe/projects/screeny/src`
- `/home/kgoe/projects/screeny/src-tauri/src`
- `/home/kgoe/projects/screeny/src/routes`
- `/home/kgoe/projects/screeny/src-tauri/src/lib.rs`
- `/home/kgoe/projects/screeny/src/routes/+page.svelte`
- `/home/kgoe/projects/screeny/src/lib`
- `/home/kgoe/projects/screeny/src/lib/actions.test.ts`
- `/home/kgoe/projects/screeny/src-tauri/tauri.conf.json`
- `/home/kgoe/projects/screeny/src/lib/actions.ts`
- `https://v2.tauri.app/develop/tests/`
- `/home/kgoe/projects/screeny/src/lib/components/Toolbar.svelte`
- `/home/kgoe/projects/screeny/src/lib/stores`
- `/home/kgoe/projects/screeny/src/lib/components/FrameViewer.svelte`
- `/home/kgoe/projects/screeny/src/lib/components/Timeline.svelte`
- `/home/kgoe/.copilot/skills/planning/templates/progress.md`
- `/home/kgoe/.copilot/skills/planning/templates/task_plan.md`
- `https://v2.tauri.app/develop/tests/webdriver/`
- `https://v2.tauri.app/develop/tests/mocking/`
- `tauri-apps/webdriver-example: README.md`

## Phase 3 Findings

- All three main UI components (`Toolbar`, `FrameViewer`, `Timeline`) now carry `data-testid` attributes on all interactive elements and key regions
- Timeline frame thumbs use dynamic `data-testid="frame-thumb-{index}"` plus `data-frame-id` for both positional and identity-based selection
- E2E mode is activated by `SCREENY_E2E=1` env var; fixture path defaults to `<repo>/tests/fixtures/test.gif` or can be overridden via `SCREENY_E2E_FIXTURE`
- Export path defaults to `/tmp/screeny-e2e/export.gif` or can be overridden via `SCREENY_E2E_EXPORT`
- E2E commands are gated: they return errors if `SCREENY_E2E` is not set, so production behaviour is unchanged
- The `gif` module was made `pub` in `lib.rs` to allow integration tests to generate fixtures; this has no runtime effect

## Phase 4 Findings

- `tauri-driver` v2.0.5 (installed via `cargo install tauri-driver`) acts as a WebDriver proxy to `WebKitWebDriver`
- **Critical**: `tauri-driver` only matches capabilities in `alwaysMatch` format, not the `firstMatch` array that wdio sends by default — the wdio config must use `[{ alwaysMatch: { "tauri:options": { application } }, firstMatch: [{}] }]`
- WebKitWebDriver on Linux rejects standard WebDriver clicks on some elements (reports "not interactable") even when they are visible and enabled — workaround is `browser.execute(el => el.click(), element)`
- `@wdio/tauri-service` (npm) exists but requires wdio v8, incompatible with v9 — manual lifecycle management in `beforeSession`/`afterSession` works fine
- `tauri-driver` inherits its parent process env to the app subprocess, so `SCREENY_E2E=1` propagates correctly
- The `pnpm tauri build` command fails at AppImage bundling due to missing `xdg-open` in the Nix environment, but the release binary is built successfully before that step
- E2E test run time is ~1.8s for 13 scenarios — fast enough for local iteration

## Phase 5 Findings

- `test:unit` (vitest) and `test:e2e` (wdio) are kept as separate scripts — no combined `test` command, so fast unit tests are the default developer flow
- macOS is unsupported by `tauri-driver` entirely, not just untested
- Windows support via `tauri-driver` is documented by Tauri upstream but needs config and prerequisite adaptation (Edge WebDriver instead of WebKitWebDriver)
- Headless CI on Linux requires a virtual compositor (e.g. `weston --backend=headless`) since the tests launch a real GUI window
