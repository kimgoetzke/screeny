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
