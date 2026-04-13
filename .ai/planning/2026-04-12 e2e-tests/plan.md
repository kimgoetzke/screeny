# Task Plan: Add full-stack E2E tests

## Goal

Add repeatable full-stack end-to-end coverage for Screeny’s core Studio flows so the Svelte UI, Tauri IPC boundary, Rust commands, and filesystem interactions are exercised together on the target desktop platform.

## Current Phase

Complete

## Phases

### Phase 1: Requirements & Discovery

- [x] Read `CLAUDE.md` for product, architecture, and platform constraints
- [x] Inspect current frontend, backend, and test setup
- [x] Document findings in `findings.md` in line with the `planning` skill
- [x] Determine plan size and required planning files
- **Status:** complete

### Phase 2: Harness design & scope lock

- [x] Confirm platform scope from `questions.md` and lock the initial execution target to Linux/Wayland native Tauri first
- [x] Choose a native E2E direction built on `tauri-driver` plus a Node WebDriver client, with `webdriverio` as the default fit for the existing pnpm workflow unless implementation finds a stronger local constraint
- [x] Define the first-pass file strategy as a dedicated E2E mode with deterministic fixture and temp output paths rather than automating real native dialogs
- [x] Outline the E2E structure around dedicated fixtures, E2E scripts, Linux prerequisite setup, and clear separation from fast unit checks
- [x] Update `plan.md`, `findings.md`, `questions.md`, and `progress.md` in line with the `planning` skill before closing the phase
- **Status:** complete

### Phase 3: App testability prep

- [x] Add stable `data-testid` selectors to `Toolbar`, `FrameViewer`, `Timeline`, `+page.svelte` and their interactive elements
- [x] Introduce deterministic test fixtures (`tests/fixtures/test.gif`) and a generator (`src-tauri/tests/generate_fixture.rs`)
- [x] Add `SCREENY_E2E` env-var-gated E2E mode: `e2e_check`, `e2e_open_fixture`, `e2e_save_path` Tauri commands in `src-tauri/src/e2e.rs`
- [x] Wire `Toolbar.svelte` to swap `DialogProvider` to E2E stubs when `e2e_check` returns true
- [x] Verify: `pnpm check` clean, all 30 frontend tests pass, Rust compiles and E2E unit tests pass
- [x] Update planning docs
- **Status:** complete

### Phase 4: Native E2E harness & first scenarios

- [x] Install `tauri-driver` (cargo) and `webdriverio` + wdio packages (pnpm)
- [x] Create `tests/e2e/wdio.conf.ts` with `tauri-driver` lifecycle, W3C `alwaysMatch` capabilities, and `SCREENY_E2E=1` env propagation
- [x] Create `tests/e2e/tsconfig.json` for E2E-specific TypeScript config
- [x] Add `test:e2e` script to `package.json`
- [x] Create 13 E2E scenarios in `tests/e2e/specs/studio.ts` covering: app launch (4), open GIF fixture (6), frame selection (1), delete frame (1), export GIF (1)
- [x] Use `jsClick` helper to bypass WebKitWebDriver interactability limitations
- [x] All 13 E2E tests pass, all 30 frontend unit tests still pass
- [x] Update planning docs
- **Status:** complete

### Phase 5: CI/docs hardening

- [x] Add local and CI run instructions covering `tauri-driver`, `WebKitWebDriver`, and any display/session prerequisites for Linux
- [x] Wire the E2E command into the project’s verification flow in a way that keeps fast unit checks separate from slower native E2E runs
- [x] Record limitations and follow-up scope, especially for Windows support and macOS gaps
- [x] Update `plan.md`, `findings.md`, `questions.md`, and `progress.md` in line with the `planning` skill before closing the phase
- **Status:** complete

## Key Questions

1. Initial implementation target: Linux/Wayland native Tauri first.
2. File-dialog strategy: use a dedicated E2E mode with deterministic fixture paths for the first rollout.

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Treat this as a multi-phase change | New tooling, app hooks, fixtures, scripts, and docs will span many files and steps |
| Define “full-stack E2E” as native Tauri WebDriver coverage, not browser-only checks | Tauri v2 docs position WebDriver as the real end-to-end path for native apps |
| Keep existing mocked/unit tests and add E2E above them | Fast lower-level tests already exist and should remain the main guard for isolated logic |
| Start with Studio MVP flows | Current product scope and UI both centre on open, view, timeline edit, and export behaviour |
| Make Linux/Wayland the only required platform in the first milestone | Matches both the project priority and the user’s answer |
| Bypass native dialogs in E2E mode instead of automating them initially | Improves determinism and keeps the first rollout focused on app behaviour |
| Default to `tauri-driver` plus `webdriverio` in the Node toolchain | Aligns with Tauri’s WebDriver path and the repo’s existing pnpm workflow |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| Planning directory creation command hung unexpectedly | 1 | Stopped that shell and continued after the user confirmed the directory already existed |

## Notes

- Re-read this file before making major planning decisions, per the `planning` skill
- Keep all planning artefacts current after each phase
- Use the `tdd` skill for all implementation work in Phases 3-5
