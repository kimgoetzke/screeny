# Progress Log

## Session: 2026-04-20

### Phase 1: Research & Planning

- **Status:** complete
- **Started:** 2026-04-20
- Actions taken:
  - Read `Inspector.svelte` — understood current layout and button structure
  - Read `frames.svelte.ts` — identified `moveFramesToInsertionPoint` as the building block
  - Read `Inspector.test.ts` — understood SSR test pattern
  - Read `frames.test.ts` — understood store test pattern
  - Read `studio.ts` (E2E) — understood E2E patterns, helpers, describe block structure
  - Created planning files: `findings.md`, `plan.md`, `questions.md`, `progress.md`
- Files created/modified:
  - `.ai/planning/2026-04-20 inspector-move-buttons/findings.md` (created)
  - `.ai/planning/2026-04-20 inspector-move-buttons/plan.md` (created)
  - `.ai/planning/2026-04-20 inspector-move-buttons/questions.md` (created)
  - `.ai/planning/2026-04-20 inspector-move-buttons/progress.md` (created)

### Phase 2: Store methods (TDD)

- **Status:** complete
- Actions taken:
  - Added store tests for `moveSelectedFramesToStart`, `moveSelectedFrameLeft`, `moveSelectedFrameRight`, and `moveSelectedFramesToEnd`
  - Added edge-case tests for left-at-start and right-at-end no-op behaviour
  - Implemented all 4 store methods in `frames.svelte.ts` on top of `moveFramesToInsertionPoint`
  - Ran targeted store tests during each red/green cycle
- Files modified:
  - `src/lib/stores/frames.test.ts`
  - `src/lib/stores/frames.svelte.ts`

### Phase 3: UI — Inspector component

- **Status:** complete
- Actions taken:
  - Added SSR coverage for the move-button row and hidden-empty-state behaviour in `Inspector.test.ts`
  - Added `bottom-actions` wrapper in `Inspector.svelte`
  - Added 4 move buttons with transport icons and wired them to the new store methods
- Files modified:
  - `src/lib/components/Inspector.test.ts`
  - `src/lib/components/Inspector.svelte`

### Phase 4: E2E tests

- **Status:** complete
- Actions taken:
  - Added `describe("Studio — inspector move-frame buttons", ...)` in `tests/e2e/specs/studio.ts`
  - Covered move-to-end, move-to-start, step-right, step-left, and multi-select move-to-end flows
  - Used `data-frame-id` assertions to verify timeline order after each action
- Files modified:
  - `tests/e2e/specs/studio.ts`

### Phase 5: Full regression run

- **Status:** complete
- Actions taken:
  - Ran `pnpm check`
  - Ran `pnpm test:unit`
  - Ran `cargo test` from `src-tauri/`
  - Ran `pnpm tauri build`
  - Ran `pnpm test:e2e`

## Test Results

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| `pnpm test:unit src/lib/stores/frames.test.ts` | Store move-button tests | New store methods and edge cases pass | 156 tests passed | pass |
| `pnpm test:unit src/lib/components/Inspector.test.ts` | Inspector SSR tests | Move-button row renders and hides correctly | 22 tests passed | pass |
| `pnpm check` | Frontend type/Svelte checks | 0 errors, 0 warnings | 0 errors, 0 warnings | pass |
| `pnpm test:unit` | Full unit suite | All frontend unit tests pass | 270 tests passed | pass |
| `cd src-tauri/ && cargo test` | Rust test suite | All Rust tests pass | 23 passed, 1 ignored, 0 failed | pass |
| `pnpm tauri build` | Desktop production build | App bundles successfully | build succeeded | pass |
| `pnpm test:e2e` | Full E2E suite | All desktop E2E tests pass | exit code 0 | pass |

## Error Log

| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-04-20 | `cargo test` from repo root could not find `Cargo.toml` | 1 | Re-ran from `src-tauri/` |

## 5-Question Reboot Check

| Question | Answer |
|----------|--------|
| Where am I? | Complete |
| Where am I going? | No further phase pending |
| What's the goal? | Add 4 move-frame buttons to inspector panel |
| What have I learned? | Move buttons work for single and multi-select; edge clicks are no-ops |
| What have I done? | Implemented store, inspector UI, E2E coverage, and full regression validation |
