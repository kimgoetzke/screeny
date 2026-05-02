# Findings

## Plan Size

**Multi-phase: Yes**
Reasoning: this review spans separate frontend and backend areas, requires multiple sub-agents, requires dependency and file-structure analysis, and requires full validation runs including build, unit, E2E, and Rust tests. That exceeds 5 tool uses by a wide margin and will produce multiple planning artefacts and review outputs.

## Requirements

- Review the repository by spawning multiple sub-agents
- Review frontend and backend separately
- Find junior-dev mistakes, code smells, refactoring opportunities, unused or redundant dependencies, and other maintainability/scalability risks
- Review file size and structure, with special attention to files over 500 lines
- For every reported issue, include the problem, why it matters, and a concrete low-risk fix
- Keep recommendations behaviour-preserving unless behaviour change is explicitly warranted
- If any existing test would need to be modified or removed, log that request in `questions.md` and ask for explicit confirmation first
- Check for warnings and either address them with accepted best practice or explain why they should not be addressed
- Run full validation: build before E2E, then all E2E, all unit tests, and all Rust tests

## Research Findings

- Frontend scripts are `build`, `check`, `test:unit`, and `test:e2e` from the repo root.
- Frontend runtime dependencies are minimal: `@tauri-apps/api` and `@tauri-apps/plugin-opener`.
- Frontend devDependencies include SvelteKit, Vite, Vitest, and WebdriverIO.
- Rust dependencies centre on Tauri, GIF decode/encode, image handling, serialisation, and `base64`.
- Rust tests are available via Cargo because `src-tauri/Cargo.toml` defines a standard package with `dev-dependencies`.
- The requested work is a repository review, not a code change, but it still needs structured findings plus full validation evidence.
- The planning templates require `questions.md` for all plans and `progress.md` for multi-phase plans.
- `questions.md` must keep questions in chronological order and leave a `### Response` block for the user.
- `progress.md` is the detailed session log and test ledger; errors belong in `plan.md`, not `progress.md`.
- Large tracked files over 500 lines that matter for review are:
  - `tests/e2e/specs/studio.ts` (1881)
  - `src/lib/stores/frames.test.ts` (1565)
  - `src/lib/components/Toolbar.svelte` (747)
  - `src-tauri/src/gif/decode.rs` (626)
  - `src/lib/stores/frames.svelte.ts` (584)
- Large generated/lock files also appear in tracked paths:
  - `src-tauri/Cargo.lock` (5863)
  - `src-tauri/.svelte-kit/ambient.d.ts` (640)
- Frontend architecture review found the biggest maintainability risks in `Toolbar.svelte`, `frames.svelte.ts`, duplicated GIF decode/open logic, scattered keyboard listeners, duplicated canvas-render logic, and accessibility-warning suppressions in interactive UI.
- Frontend test/dependency review found the biggest structural risks in `tests/e2e/specs/studio.ts`, `src/lib/stores/frames.test.ts`, raw-source assertions in several unit tests, root TypeScript config leaking E2E types into the app, and likely-redundant `@types/mocha`.
- Backend architecture review found the biggest risks in `src-tauri/src/gif/decode.rs`, `src-tauri/src/lib.rs` command/state ownership, silent channel-send failures, weak backend validation of encoded frame input, and env-mutating tests.
- Backend dependency/test review found confirmed unused or mis-scoped crates: `image` appears unused in runtime code, and `serde_json` appears test-only and should move to `dev-dependencies`.
- Spot check: `tsconfig.json` includes `@wdio/globals/types` and `mocha` in the root app config, while `tests/e2e/tsconfig.json` already scopes E2E types separately. That confirms the ambient-type leakage finding.
- Spot check: root `index.html` is clearly stale Leptos/Trunk scaffolding (`data-trunk`, title `Tauri + Leptos App`) and does not match the active SvelteKit/Vite setup.
- Spot check: `src-tauri/.gitignore` ignores only `target/` and generated capability schemas, so tracked/generated files under `src-tauri/.svelte-kit/` should be treated as a possible repo-hygiene issue if they are not intentionally committed.
- Spot check: `svelte.config.js` is a normal root SvelteKit config, but `src-tauri/.svelte-kit/tsconfig.json` points back up to `../src/**` and `../tests/**`. That strengthens the case that `src-tauri/.svelte-kit/` is generated spillover in an odd location rather than source that should be hand-maintained.
- Validation results:
  - `pnpm check`: passed, 0 errors, 0 warnings
  - `pnpm build`: passed, no warnings surfaced
  - `pnpm test:unit`: passed, 13 files / 342 tests
  - `pnpm tauri build`: passed, no compiler warnings surfaced
  - `cargo test` in `src-tauri`: passed, 28 Rust tests plus doc-tests; 2 fixture generators ignored as expected
  - `pnpm test:e2e`: passed, 2 spec files / 103 tests
- Build/test validation did not surface actionable compiler or tooling warnings. Warning-related concerns in the final review are therefore static maintainability/a11y/test-structure issues rather than failing-tool output.
- User requested a plan restructure for execution: collapse the completed review work into 1-2 phases, then split the remaining work into narrow phases based on findings, keeping frontend and backend work separate unless a small end-to-end phase is intrinsically required.
- Restructure decision: keep two completed phases (`review discovery and triage`, `validation and review delivery`), then create small pending phases per finding cluster so future execution can be done with minimal context.
- Grouping decisions for pending phases:
  - Frontend architecture work stays split between toolbar, frame store, decode flow, interaction plumbing, rendering utility, test architecture, and TS/dependency hygiene.
  - Cross-cutting repo hygiene gets its own tiny phase because it touches build artefacts and entrypoints rather than frontend or backend logic.
  - Backend work stays split between decode module decomposition, decode session lifecycle, command/error surface cleanup, encode boundary hardening, dependency hygiene, and test infrastructure.
- User requested a plan restructure for execution: collapse the completed review work into 1-2 phases, then split the remaining work into narrow phases based on findings, keeping frontend and backend work separate unless a small end-to-end phase is intrinsically required.
- Restructure decision: keep two completed phases (`review discovery and triage`, `validation and review delivery`), then create small pending phases per finding cluster so future execution can be done with minimal context.
- Grouping decisions for pending phases:
  - Frontend architecture work stays split between toolbar, frame store, decode flow, interaction plumbing, rendering utility, test architecture, and TS/dependency hygiene.
  - Cross-cutting repo hygiene gets its own tiny phase because it touches build artefacts and entrypoints rather than frontend or backend logic.
  - Backend work stays split between decode module decomposition, decode session lifecycle, command/error surface cleanup, encode boundary hardening, dependency hygiene, and test infrastructure.

- Phase 4 decision: implement. `frames.svelte.ts` extracted into `frameSelection.ts` (11 pure selection functions) and `frameEditing.ts` (13 pure frame editing functions). Store reduced from 584 to ~200 lines; public API unchanged; all 346 unit tests pass.
- Domain interview surfaced two new terms added to `context.md`: **Selection** (anchor + active end + selected set) and **Frame Editing** (pure operations that mutate the frame sequence). Loading state and `loadSessionId` confirmed as implementation details of existing Loading Project State and Cancel terms — no new domain terms needed.
- Phase 5 decision: implement. Domain interview resolved drag-drop import as the same **Open** action as toolbar Open, with current feedback surfaces preserved. Implemented shared `openProjectFromPath()` and shared `tauriGifBackend` so toolbar-open and drag-drop now share decode lifecycle and cancellation ownership. Replaced brittle `handleDrop` source-text checks with `projectOpen.test.ts` behaviour tests; `pnpm check`, `pnpm build`, and `pnpm test:unit` all passed.
- Phase 6 decision: implement, but with a different focus than the original review wording. Domain interview resolved **Canvas** as the canonical term for the preview surface and **Keyboard Binding** as app-wide by default; the user explicitly rejected a focus-bound shortcut model and wanted bindings such as `Ctrl+R` to keep working even while a modal is open.
- Phase 6 implementation: introduced `keyboardPolicy.ts` so page, toolbar, and timeline listeners share an explicit shortcut policy; plain `Enter`/`Escape` remain contextual, while timeline editing bindings still yield to text-entry fields. Introduced `inspectorLayout.ts` so `+page.svelte` computes visible canvas width from a stable contract rather than querying `[data-testid="inspector"]`, and timeline drag geometry now uses `data-frame-id` rather than test-only selectors.
- Phase 6 naming follow-up: after the domain term was settled, the user explicitly asked for code naming to align too. Renamed `FrameViewer` → `Canvas`, `viewer-fit` → `canvas-fit`, plus the related page state, test ids, and affected studio E2E selectors so the code no longer mixes the old term with the canonical one.
- Phase 6 accessibility scope: fixed the small behaviour-preserving interaction issues now (`HelpMenu`, `NotificationDialog`, and `FilePicker` no longer rely on ignored click-event warnings; file-picker entries are keyboard reachable). Deferred deeper timeline-thumb semantics work because that would need a broader structural pass through the timeline markup and keyboard model rather than the narrow cleanup this phase targeted.
- Phase 9 domain-model check: no new domain terms or ADRs were needed. The existing glossary already covers the store split points that matter here: **Selection**, **Playback**, **Project State** (for loading), and **Frame Editing**.
- Phase 9 decision: narrow the original review finding. Do not tackle SSR-vs-DOM strategy or raw-source assertion cleanup yet; only split `src/lib/stores/frames.test.ts` into smaller files that match the current store architecture and domain language.
- Phase 9 implementation: replaced `src/lib/stores/frames.test.ts` with focused files for store basics, playback, loading, selection, and frame-editing subareas (deletion, deduplication, movement, duration, duplication), plus shared test support. Behaviour coverage stayed unchanged; only file structure changed.
- Phase 10 domain-model check: no new glossary term or ADR was needed. The user explicitly wanted this phase treated as implementation hygiene only, not as a domain-language change.
- Phase 10 decision: implement. Make `tests/e2e/tsconfig.json` the single source of truth for E2E framework types, remove E2E ambient types from the root app config, and remove `@types/mocha` only if validation stays green.
- Phase 10 implementation: removing E2E globals from the root `tsconfig.json` exposed that `.svelte-kit/tsconfig.json` still pulls `../tests/**/*.ts` into the root `svelte-check` graph. Fixed the leakage by explicitly excluding `tests/e2e/**` from the root config, then removed the per-file `/// <reference types="mocha" />` directives and the redundant `@types/mocha` dependency. `pnpm check`, `pnpm build`, `pnpm test:unit`, `pnpm tauri build`, and `pnpm test:e2e` all passed.
- Phase 11 domain-model check: no new glossary term or ADR was needed. This phase is repo hygiene, not product language, so the domain work was to confirm that no new term belonged in `context.md`.
- Phase 11 decision: implement. Treat `src-tauri/.svelte-kit/` as generated spillover that should not be committed, and treat the root `index.html` as stale Leptos/Trunk scaffold because the active SvelteKit shell already lives in `src/app.html`.
- Phase 11 implementation: added `/.svelte-kit/` to `src-tauri/.gitignore`, removed the tracked files under `src-tauri/.svelte-kit/`, and deleted the stale root `index.html`. `pnpm check` and `pnpm build` both passed afterwards.
- Phase 12 decision: implement. Module decomposition and bounds safety are both worth doing; `count_gif_frames_in_path` prepass is still required for `Start { total_frames }` UX reporting so it is kept, not removed.
- Phase 12 implementation: added `canvas_height` parameter and `Result<(), String>` return type to `composite_frame` and `clear_frame_area`, with explicit bounds checks before any pixel access. Propagated errors via `?` in `decode_gif_streaming`. Converted `decode.rs` (626 lines) to a `decode/` directory module: `composite.rs` owns the compositing helpers and bounds-safety tests; `frame_count.rs` owns the hand-rolled GIF frame-count prepass; `progress.rs` owns `ProgressReader`; `mod.rs` owns the decode pipeline and public-API tests. All 32 Rust tests pass.
- Phase 13 decision: implement all three lifecycle issues. No frontend path assumes duplicate decode IDs are tolerated (confirmed by checking `tauriGifBackend.ts` — it always increments a session counter). Send-failure cleanup is non-breaking since the cancelled flag is only used to abort the current decode.
- Phase 13 implementation: extracted `register_decode_session` helper (duplicate-rejection logic, tested in isolation); updated `decode_gif_stream` to use it (fix 2), moved `map.remove` before the join-result propagation (fix 1), and set `cancelled = true` on `on_event.send` failure (fix 3). Tauri command signature unchanged. All 34 Rust tests pass.
- Phase 14 decision: implement lock hardening only; defer `list_dir` entry-skipping (intentional file-picker behavior — show what you can, not an error on a single unreadable entry) and defer `lib.rs` module split (file is now ~270 lines after Phase 12–13 cleanup, splitting would add overhead without readability benefit).
- Phase 14 implementation: three `Mutex::lock()` sites hardened — pre-spawn lock in `decode_gif_stream` now maps poisoning to `Err` (command already returns `Result`); cleanup lock uses `unwrap_or_else(|e| e.into_inner())` so cleanup always runs even after a panic; `cancel_gif_decode` lock uses the same recovery pattern to avoid a panic in a void command. Added a specification test documenting the map-cleanup contract. All 35 Rust tests pass.
- Phase 15 decision: implement all three issues. (1) Dimension consistency check upfront (before spawning the write thread) so mismatched frames are rejected before any file I/O begins. (2) RGBA byte-count validation inline (after base64 decode, before `ImgVec::new`) to prevent an imgref out-of-bounds panic inside a gifski internal thread. (3) Restructure loop to collect `encode_error: Option<String>` instead of using `?` so `drop(collector)` and `write_thread.join()` are always reached on all exit paths.
- Phase 15 implementation: added upfront dimension-consistency loop (returns `Err` if any frame width/height differs from frame 0); added `expected_bytes` check after each base64 decode; restructured loop body to break-on-error rather than early-return; always `drop(collector)` then join the write thread before returning any error. Three new RED→GREEN tests added: `encode_gif_file_rejects_mismatched_width`, `encode_gif_file_rejects_mismatched_height`, `encode_gif_file_rejects_wrong_rgba_length`. All 38 Rust tests pass.
- Phase 16 decision: implement both changes. `image` confirmed zero references anywhere in source or test code — safe to remove outright. `serde_json` confirmed test-only (both uses are inside `#[cfg(test)]` in `gif/mod.rs`) — safe to move to `[dev-dependencies]`. No build-script or generated-code path depends on either crate.
- Phase 16 implementation: removed `image` and `serde_json` from `[dependencies]`; added `serde_json = "1"` to `[dev-dependencies]`. No source code changes required. All 38 Rust tests still pass after recompile.
- Phase 17 decision (revised after review): implement env-var isolation with full save/restore semantics and a crate-wide lock. Fixture-builder duplication (`make_export_frame` in `encode.rs` and `generate_fixture.rs`) deferred — sharing across the lib/integration-test boundary requires a `test-helpers` feature flag that adds `Cargo.toml` complexity for two copies of a trivial helper. Fixture-path centralisation deferred — `decode/mod.rs` uses compile-time `CARGO_MANIFEST_DIR` for `src-tauri/tests/fixtures/` while `generate_fixture.rs` uses a runtime `project_root()` for the repo-root `tests/fixtures/`; these point to different directories and cannot share a single `fixture_path_for(name)` without relocating fixtures.
- Phase 17 implementation (revised): created `src/testing.rs` (only compiled under `#[cfg(test)]`) with a crate-wide `static ENV_LOCK: Mutex<()>` and an `EnvGuard` struct. `EnvGuard::set`/`remove` save the previous env-var value and restore it on `Drop`, so tests leave the environment exactly as they found it even on panic. Updated `e2e.rs` tests to acquire `ENV_LOCK` and use `EnvGuard` instead of manual `set_var`/`remove_var`. All 38 Rust tests pass; `pnpm tauri build` and `pnpm test:e2e` (103 tests, 8 spec files) both pass.

## Resources

- `package.json`
- `src-tauri/Cargo.toml`
- `src/lib/components/Toolbar.svelte`
- `src/lib/stores/frames.svelte.ts`
- `src/lib/stores/frames.test.ts`
- `src-tauri/src/gif/decode.rs`
- `tests/e2e/specs/studio.ts`
- `.ai/planning/2026-04-26 repo-review/`

## Visual/Browser Findings

- None yet.

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
