# Plan: Review follow-up execution

## Goal

Turn the completed repository review into a sequence of small, mostly independent execution phases that can each be implemented or rejected safely with minimal context.

## User Prompt

Restructure the existing review plan so the work already completed is merged into 1-2 phases, then add new small phases based on the review findings. Keep frontend and backend work separate unless a very small end-to-end phase is intrinsically required. Each new phase must contain enough background to execute it in isolation: what the finding is, why it matters, suggested fix, references, relevant context already known, extra research to do, and sensible steps including research, fix-vs-reject, relevant-skill selection, implementation using `tdd` if code changes are made, and planning-file updates.

## Current Phase

Phase 5

## Phases

### Phase 1: Completed review discovery and triage

- **Background**
  - **What:** Repository inventory, large-file discovery, dependency review, frontend/backend sub-agent analysis, and findings capture are complete.
  - **Why it mattered:** This established the maintainability/scalability risk map and identified the highest-value future phases.
  - **Suggested fix:** No further implementation work in this phase; treat it as the completed evidence-gathering baseline for all later phases.
  - **References:** `package.json`, `src-tauri/Cargo.toml`, `src/lib/components/Toolbar.svelte`, `src/lib/stores/frames.svelte.ts`, `src/lib/stores/frames.test.ts`, `src-tauri/src/gif/decode.rs`, `tests/e2e/specs/studio.ts`, `findings.md`
  - **Relevant context:** Large files and dependency concerns are already logged in `findings.md`; the broad review findings should be treated as hypotheses to confirm before changing code.
  - **Additional research:** None required unless a later phase needs deeper local context.
- [x] Inventory the repository, large files, and dependency surface
- [x] Spawn frontend/backend review sub-agents and consolidate findings
- [x] Update `plan.md`, `findings.md`, `questions.md`, and `progress.md` in line with the `planning` skill
- **Status:** Complete

### Phase 2: Completed validation and review delivery

- **Background**
  - **What:** Full validation and the written repository review are complete.
  - **Why it mattered:** This confirmed the review findings were collected against a green baseline: `pnpm check`, `pnpm build`, `pnpm test:unit`, `pnpm tauri build`, `pnpm test:e2e`, and `cargo test` all passed.
  - **Suggested fix:** No implementation here; use this phase as the baseline validation state before future changes.
  - **References:** `progress.md`, `findings.md`
  - **Relevant context:** No actionable compiler/build/test warnings surfaced, so future warning work is about static maintainability issues rather than failing-tool output.
  - **Additional research:** None required before Phase 3.
- [x] Run the required validation commands in the correct order
- [x] Deliver the structured frontend/backend review to the user
- [x] Update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Complete

### Phase 3: Frontend toolbar decomposition

- **Background**
  - **What:** `src/lib/components/Toolbar.svelte` is 747 lines and mixes file I/O orchestration, Tauri calls, modal state, titlebar controls, help UI, close-confirm UI, and E2E-specific behaviour.
  - **Why it matters:** It is a broad regression hotspot; unrelated changes land in the same component and UI state becomes tightly coupled to backend orchestration.
  - **Suggested fix:** Keep current behaviour and public UI, but extract focused helpers/components for open/export control flow, save-path prompting, help/close dialog state, and window controls.
  - **References:** `src/lib/components/Toolbar.svelte`, `src/lib/components/Toolbar.test.ts`, `src/routes/+page.svelte`, `findings.md`
  - **Relevant context:** The toolbar finding is independent of backend fixes and can be handled as pure frontend work first.
  - **Additional research:** Confirm which local state must remain in the component versus move into helpers, and check whether any E2E-specific branches can be pushed behind helper seams without behavioural change.
  - **Relevant skills:** `research-codebase` if extra local understanding is needed; `tdd` before any code changes.
- [x] Re-read this plan and inspect the referenced files to confirm the exact extraction seams
- [x] Decide fix vs reject/defer and record the rationale in `findings.md`
- [x] Decide the exact helper/component boundaries and whether any extra skill support is needed
- [x] If implementing, invoke `tdd`, make the smallest behaviour-preserving extraction, and adapt tests as needed; if an existing test must be removed or materially rewritten, ask first via `questions.md`
- [x] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Complete

### Phase 4: Frontend frame store decomposition

- **Background**
  - **What:** `src/lib/stores/frames.svelte.ts` is 584 lines and owns selection, playback, loading, deduplication, reordering, deletion, duplication, and duration editing.
  - **Why it matters:** Too many state transitions live together, which makes invariants hard to reason about and increases the chance of regressions when touching unrelated behaviour.
  - **Suggested fix:** Keep the public `frameStore` API stable, but move pure logic into internal modules/helpers by concern.
  - **References:** `src/lib/stores/frames.svelte.ts`, `src/lib/stores/frames.test.ts`, `findings.md`
  - **Relevant context:** This phase pairs naturally with focused test splitting later, but it can start independently if the store API stays stable.
  - **Additional research:** Confirm which logic is already pure enough to extract immediately and which invariants need stronger tests before refactor.
  - **Relevant skills:** `research-codebase` for local invariant tracing; `tdd` before any code changes.
- [x] Re-read this plan and inspect store methods/tests to map natural internal boundaries
- [x] Decide fix vs reject/defer and record the rationale in `findings.md`
- [x] Decide whether to split helper modules first or add missing focused tests first; invoke `tdd` before code changes
- [x] If implementing, preserve the exported store API and keep test changes behaviour-preserving; ask first in `questions.md` if any existing test would need removal or major rewrite
- [x] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Complete

### Phase 5: Frontend GIF open/decode flow consolidation

- **Background**
  - **What:** GIF open/decode lifecycle logic is duplicated across `src/routes/+page.svelte`, `src/lib/components/Toolbar.svelte`, and `src/lib/actions.ts`.
  - **Why it matters:** Decode event-shape changes, cancellation handling, or loading-state changes must be kept in sync manually.
  - **Suggested fix:** Extract one shared frontend decode/open helper or service and make the existing entry points call it.
  - **References:** `src/routes/+page.svelte`, `src/lib/components/Toolbar.svelte`, `src/lib/actions.ts`, `findings.md`
  - **Relevant context:** This is frontend-only even though it talks to backend commands, because the duplicated problem is in frontend orchestration.
  - **Additional research:** Confirm whether drag-drop and toolbar-open have any intentional behaviour differences that should remain separate.
  - **Relevant skills:** `research-codebase` if the decode lifecycle still feels unclear; `tdd` before any code changes.
- [ ] Re-read this plan and trace both decode/open entry points end-to-end
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide the shared helper/service boundary and invoke `tdd` before implementation
- [ ] If implementing, keep backend IPC contracts unchanged and ask first via `questions.md` if any existing test must be removed or materially rewritten
- [ ] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 6: Frontend interaction plumbing cleanup

- **Background**
  - **What:** Shortcut handling is scattered across multiple global listeners, runtime layout depends on `data-testid`/current inspector DOM structure, and several interactive elements suppress accessibility warnings or use non-semantic click targets.
  - **Why it matters:** Input handling, focus behaviour, and layout contracts are fragile and easy to break during unrelated UI changes.
  - **Suggested fix:** Centralise or clearly gate shortcut handling, replace runtime `data-testid`/DOM queries with explicit layout contracts, and prefer native interactive elements or complete keyboard semantics.
  - **References:** `src/routes/+page.svelte`, `src/lib/components/Inspector.svelte`, `src/lib/components/HelpMenu.svelte`, `src/lib/components/FilePicker.svelte`, `src/lib/components/NotificationDialog.svelte`, `src/lib/components/Timeline.svelte`, `findings.md`
  - **Relevant context:** This phase intentionally groups interaction-contract issues because they all affect top-level UI coordination and accessibility semantics.
  - **Additional research:** Confirm whether any current shortcuts intentionally overlap and whether inspector width/minimised state can be exposed through existing bindings rather than new state.
  - **Relevant skills:** `research-codebase` for event-flow tracing; `tdd` before any code changes.
- [ ] Re-read this plan and trace current shortcut/layout/focus behaviour through the referenced files
- [ ] Decide which findings to fix now versus defer/reject, and record that rationale in `findings.md`
- [ ] Decide the narrowest safe interaction-contract change set and invoke `tdd` before implementation
- [ ] If implementing, keep behaviour-preserving where possible and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 7: Frontend rendering utility extraction

- **Background**
  - **What:** Raw RGBA-to-canvas rendering logic is duplicated in `FrameViewer.svelte` and `Timeline.svelte`.
  - **Why it matters:** Any rendering change requires duplicate low-level edits, which is easy to miss.
  - **Suggested fix:** Extract a shared canvas rendering utility and use it in both components.
  - **References:** `src/lib/components/FrameViewer.svelte`, `src/lib/components/Timeline.svelte`, `findings.md`
  - **Relevant context:** This is a small, high-confidence refactor candidate with narrow blast radius.
  - **Additional research:** Confirm whether the two call sites have any intentional differences in sizing or image-data handling before extracting.
  - **Relevant skills:** `tdd` before any code changes; `research-codebase` only if the renderer contracts are unclear.
- [ ] Re-read this plan and confirm the duplicated rendering paths are functionally equivalent
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Invoke `tdd` before implementation if extraction proceeds
- [ ] If implementing, keep the utility tiny and behaviour-preserving; ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 8: Frontend E2E suite decomposition and determinism

- **Background**
  - **What:** `tests/e2e/specs/studio.ts` is 1881 lines, mixes helpers and many unrelated suites, relies on prior suite state, repeats fixture-load flows, and uses many fixed waits.
  - **Why it matters:** The E2E suite is hard to navigate, hard to run in isolation, slower than needed, and more fragile than it should be.
  - **Suggested fix:** Split the spec by feature area, centralise shared helpers, make each suite establish its own state, and replace fixed sleeps with condition-based waits where possible.
  - **References:** `tests/e2e/specs/studio.ts`, `tests/e2e/specs/splashscreen.ts`, `tests/e2e/wdio.conf.ts`, `findings.md`
  - **Relevant context:** Full E2E validation already passes, so this is a maintainability/refactoring phase rather than a failure fix.
  - **Additional research:** Confirm which helpers already exist and which repeated setup flows can be standardised without changing test intent.
  - **Relevant skills:** `tdd` before test-architecture changes; `research-codebase` for local WDIO helper discovery.
- [ ] Re-read this plan and map the current E2E suite into candidate feature-based files
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide whether to start with helper extraction, file splitting, or wait replacement; invoke `tdd` before changing tests
- [ ] If implementing, keep behaviour coverage equivalent and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run the relevant E2E-focused validation plus any affected broader checks, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 9: Frontend unit and component test strategy cleanup

- **Background**
  - **What:** `src/lib/stores/frames.test.ts` is 1565 lines, several tests assert raw source text or regexes instead of behaviour, and the current SSR-only component-test approach may be encouraging brittle checks.
  - **Why it matters:** Tests become hard to maintain, noisy under refactor, and weaker at protecting user-visible behaviour.
  - **Suggested fix:** Split large test files by behaviour area, move source-text assertions toward behaviour or pure-helper tests, and explicitly decide whether to keep the current SSR-only strategy or add a separate DOM-oriented test layer.
  - **References:** `src/lib/stores/frames.test.ts`, `src/routes/page.test.ts`, `src/lib/components/FrameViewer.test.ts`, `src/lib/components/Timeline.test.ts`, `src/lib/components/Toolbar.test.ts`, `src/lib/splashscreen.test.ts`, `vite.config.js`, `findings.md`
  - **Relevant context:** Project guidance currently says unit tests use SSR rendering only and must not use `mount()` without broader config changes, so any DOM-test decision needs careful justification.
  - **Additional research:** Confirm whether a DOM-oriented component test layer is worth the extra config complexity, or whether extracting more pure helpers gives enough behaviour coverage while staying SSR-only.
  - **Relevant skills:** `tdd` before any test changes; `research-codebase` for local test-pattern discovery.
- [ ] Re-read this plan plus the project testing guidance and inspect the referenced tests
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide whether this phase stays SSR-only or just documents why a DOM layer is not worth adding right now; invoke `tdd` before changing tests
- [ ] If implementing, keep or improve behavioural coverage and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 10: Frontend TypeScript and dependency hygiene

- **Background**
  - **What:** Root `tsconfig.json` pulls E2E-only globals into the app graph, and `@types/mocha` looks likely redundant because E2E types are already scoped in `tests/e2e/tsconfig.json`.
  - **Why it matters:** Ambient-type leakage broadens the app compile surface and makes it less clear which dependencies are actually needed.
  - **Suggested fix:** Keep E2E-only types scoped to the E2E config and verify whether `@types/mocha` can be removed safely.
  - **References:** `tsconfig.json`, `tests/e2e/tsconfig.json`, `package.json`, `findings.md`
  - **Relevant context:** This is a low-risk frontend hygiene phase if compile/test results stay green.
  - **Additional research:** Confirm whether any non-E2E file truly depends on `mocha` globals before removing them from the root config.
  - **Relevant skills:** `tdd` before dependency/config changes; `research-codebase` if ambient-type usage is unclear.
- [ ] Re-read this plan and inspect type usage across the repo to confirm whether the root config needs E2E globals
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide the smallest safe config/dependency change set and invoke `tdd` before implementation
- [ ] If implementing, remove only proven-redundant declarations/dependencies and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 11: Cross-cutting repo artefact hygiene

- **Background**
  - **What:** The repo contains stale root `index.html` Leptos/Trunk scaffolding and tracked/generated-looking files under `src-tauri/.svelte-kit/`.
  - **Why it matters:** These artefacts make the repo harder to understand and may cause accidental edits or confusion about the active toolchain.
  - **Suggested fix:** Confirm whether each artefact is intentionally committed; remove or ignore stale/generated artefacts if safe, otherwise document why they exist.
  - **References:** `index.html`, `src-tauri/.gitignore`, `src-tauri/.svelte-kit/tsconfig.json`, `svelte.config.js`, `findings.md`
  - **Relevant context:** This phase is deliberately cross-cutting because it is about repo/build hygiene rather than frontend or backend runtime logic.
  - **Additional research:** Confirm how `src-tauri/.svelte-kit/` is being generated and whether any tooling actually depends on it being committed.
  - **Relevant skills:** `research-codebase` for toolchain tracing; `tdd` only if changes affect checked-in configs or tests.
- [ ] Re-read this plan and confirm which artefacts are stale versus intentionally required
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide whether the right change is removal, `.gitignore` adjustment, or documentation, and invoke `tdd` before any code/config changes
- [ ] If implementing, keep the change set tiny and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run the smallest relevant validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 12: Backend decode module decomposition and safety

- **Background**
  - **What:** `src-tauri/src/gif/decode.rs` is 626 lines, mixes multiple concerns, duplicates frame-count parsing alongside actual decode logic, and relies on unchecked slice indexing in compositing helpers.
  - **Why it matters:** Decoder changes carry a large regression surface, and bad geometry assumptions can turn malformed input into panics.
  - **Suggested fix:** Split the module by concern, isolate or remove duplicate parsing paths behind a focused internal API, and add checked bounds handling where frame geometry can exceed canvas bounds.
  - **References:** `src-tauri/src/gif/decode.rs`, `findings.md`
  - **Relevant context:** Existing Rust decode tests are green and give a safety net, but the module shape still makes safe iteration harder than it should be.
  - **Additional research:** Confirm whether the duplicate frame-count prepass is still required for UX/progress reporting and whether bounds errors should abort the decode or skip invalid frames.
  - **Relevant skills:** `tdd` before Rust changes; `research-codebase` if decode invariants need more tracing.
- [ ] Re-read this plan and inspect the decode pipeline plus its tests to confirm the exact decomposition plan
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide whether to start with module split, bounds checks, or frame-count-path isolation; invoke `tdd` before implementation
- [ ] If implementing, keep public decode APIs stable and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run focused Rust tests plus any affected broader validation, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 13: Backend decode session lifecycle hardening

- **Background**
  - **What:** `decode_gif_stream` can leave stale cancel entries on join failure, trusts duplicate caller-supplied `decode_id` values, and ignores frontend channel-send failures.
  - **Why it matters:** Decode-session ownership becomes ambiguous and backend work can continue after the frontend receiver has gone away.
  - **Suggested fix:** Always clean up cancel entries, reject duplicate decode IDs, and treat send failure as a terminal condition.
  - **References:** `src-tauri/src/lib.rs`, `findings.md`
  - **Relevant context:** This phase is logically separate from decode module splitting because it focuses on command/session ownership rather than parsing/compositing internals.
  - **Additional research:** Confirm whether any frontend path currently assumes duplicate decode IDs are tolerated and whether send-failure cleanup should cancel or return an explicit error.
  - **Relevant skills:** `tdd` before Rust changes; `research-codebase` if IPC flow is unclear.
- [ ] Re-read this plan and trace decode-session ownership from command entry to cancellation cleanup
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide the smallest safe session-lifecycle hardening changes and invoke `tdd` before implementation
- [ ] If implementing, keep IPC shape stable where possible and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run focused Rust tests plus any affected broader validation, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 14: Backend command surface and error-path cleanup

- **Background**
  - **What:** `src-tauri/src/lib.rs` mixes multiple responsibilities, uses `Mutex::lock().unwrap()`, and `list_dir` silently drops unreadable entries.
  - **Why it matters:** Command ownership is unclear, poisoned state can panic instead of returning IPC errors, and filesystem results can be partial without explanation.
  - **Suggested fix:** Split `lib.rs` by command area, map lock failures to explicit errors, and make directory-listing failure semantics explicit.
  - **References:** `src-tauri/src/lib.rs`, `findings.md`
  - **Relevant context:** This phase is about command boundaries and error semantics, not decode internals or encode validation.
  - **Additional research:** Confirm whether `list_dir` should fail hard or return structured skip information, and whether command-module extraction should happen before or after error mapping.
  - **Relevant skills:** `tdd` before Rust changes; `research-codebase` for command-registration tracing.
- [ ] Re-read this plan and inspect command wiring plus current error paths
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide the order of module extraction versus error handling changes and invoke `tdd` before implementation
- [ ] If implementing, keep command names stable and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run focused Rust tests plus any affected broader validation, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 15: Backend encode boundary hardening

- **Background**
  - **What:** `encode_gif_file` trusts frontend-provided frame metadata too much and can leave writer-thread cleanup unclear on mid-loop failure.
  - **Why it matters:** Weak validation at the IPC boundary makes encoding more brittle and harder to reason about when input is malformed.
  - **Suggested fix:** Validate RGBA length and uniform frame dimensions before encoding, and ensure writer-thread cleanup/join behaviour is explicit on all exit paths.
  - **References:** `src-tauri/src/gif/encode.rs`, `src-tauri/src/gif/mod.rs`, `findings.md`
  - **Relevant context:** This phase is separate from decode work and should stay focused on export-path correctness.
  - **Additional research:** Confirm whether bad frame input should fail fast before any output file is touched and whether current tests fully cover partial-failure cleanup.
  - **Relevant skills:** `tdd` before Rust changes; `research-codebase` if the export path needs deeper tracing.
- [ ] Re-read this plan and inspect encode-path validation and cleanup behaviour
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide whether to lead with validation, thread cleanup, or extra tests, and invoke `tdd` before implementation
- [ ] If implementing, keep exported command semantics stable and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run focused Rust tests plus any affected broader validation, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 16: Backend dependency hygiene

- **Background**
  - **What:** `image` appears unused in runtime backend code and `serde_json` appears to be needed only by tests.
  - **Why it matters:** Unused or mis-scoped dependencies enlarge the shipped or direct dependency graph unnecessarily.
  - **Suggested fix:** Remove `image` if confirmed unused and move `serde_json` into `dev-dependencies`.
  - **References:** `src-tauri/Cargo.toml`, `src-tauri/src/gif/mod.rs`, `findings.md`
  - **Relevant context:** This is a small, low-risk backend hygiene phase if the dependency findings hold under direct confirmation.
  - **Additional research:** Confirm there is no build-script or generated-code path depending on `image` before removing it.
  - **Relevant skills:** `tdd` before dependency changes; `research-codebase` if any indirect dependency usage is unclear.
- [ ] Re-read this plan and directly confirm crate usage before changing `Cargo.toml`
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Invoke `tdd` before implementation if dependency cleanup proceeds
- [ ] If implementing, keep the change set narrow and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run the smallest relevant Rust validation commands, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

### Phase 17: Backend test infrastructure cleanup

- **Background**
  - **What:** Backend tests mutate process-global environment variables without isolation, duplicate fixture-builder logic, and reconstruct fixture paths in multiple places.
  - **Why it matters:** This increases test fragility, future parallel-test risk, and maintenance overhead when fixtures change.
  - **Suggested fix:** Add a test-only env guard, centralise shared fixture builders, and move fixture-path resolution behind one helper.
  - **References:** `src-tauri/src/e2e.rs`, `src-tauri/src/gif/decode.rs`, `src-tauri/src/gif/encode.rs`, `src-tauri/tests/generate_fixture.rs`, `findings.md`
  - **Relevant context:** Existing Rust tests are green, so this phase is maintainability-focused rather than failure-driven.
  - **Additional research:** Confirm the smallest shared location for test helpers and whether fixture generators should remain ignored or be documented more clearly.
  - **Relevant skills:** `tdd` before Rust test changes; `research-codebase` for local test-helper discovery.
- [ ] Re-read this plan and inspect current backend test helper patterns and env usage
- [ ] Decide fix vs reject/defer and record the rationale in `findings.md`
- [ ] Decide the narrowest safe helper extraction/isolation plan and invoke `tdd` before implementation
- [ ] If implementing, keep test intent stable and ask first via `questions.md` if any existing test would need removal or major rewrite
- [ ] Run focused Rust tests plus any affected broader validation, then update `plan.md`, `findings.md`, and `progress.md` in line with the `planning` skill
- **Status:** Pending

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Keep a multi-phase plan | Future implementation work is larger than a single context window and must stay trackable |
| Collapse completed work into 2 phases | The user asked for a short completed-history section rather than many review-only phases |
| Keep frontend and backend work separate | The user explicitly wants phases that minimise mixed context |
| Use one narrow phase per finding cluster | Small, isolated phases reduce regression risk and context load |
| Treat each finding as a hypothesis to confirm before change | The review identified likely issues, but each execution phase should still decide fix vs reject/defer |
| Use `tdd` before any code or test changes | The planning skill requires TDD-minded execution for implementation work |
| Ask via `questions.md` before removing or materially rewriting existing tests | The user explicitly required approval before that kind of test change |

## Errors Encountered

| Timestamp | Error | Attempt | Resolution |
| --------- | ----- | ------- | ---------- |
| 2026-04-26 08:18 UTC | Large-file inventory via `find`/`wc -l` did not finish promptly | 1 | Stopped it and switched to a different inventory method |
| 2026-04-26 08:19 UTC | Attempted Python-based inventory helper, but Python is unavailable in this environment | 2 | Switched to shell/Node-based alternatives instead of retrying Python |
| 2026-04-26 08:21 UTC | Node-based inventory helper also stalled without producing output | 3 | Switched to a simple `git ls-files \| wc -l` inventory command, which succeeded |

## Notes

- Relevant execution skills: `research-codebase` for deeper local understanding and `tdd` before any code or test changes
- Validation order must respect the user constraint: build before E2E
- Any request to modify or remove existing tests must be logged in `questions.md` before making that change
