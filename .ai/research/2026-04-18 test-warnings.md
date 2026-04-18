# Test Warnings Snapshot — 2026-04-18

All three test suites run on this date. Results documented below.

---

## Unit Tests (`pnpm test:unit`)

**Result:** 126 passed, 0 failed

### Warnings

| File                                   | Line | Severity | Message                                                                                                                                                     |
| -------------------------------------- | ---- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/components/FilePicker.svelte` | 71   | WARNING  | `` `<div>` with a click handler must have an ARIA role `` ([a11y_no_static_element_interactions](https://svelte.dev/e/a11y_no_static_element_interactions)) |

**Note:** Emitted by `vite-plugin-svelte` during test transform, not by Vitest itself. Pre-existing — not introduced by recent changes.

---

## Rust Tests (`cargo test --manifest-path src-tauri/Cargo.toml`)

**Result:** 23 passed, 0 failed, 1 ignored, 0 warnings

No warnings emitted by the Rust compiler or tests.

---

## TypeScript / Svelte (`npx svelte-check`)

**Result:** 1 real warning; all errors are pre-existing infrastructure issues.

### Genuine warning

| File                                   | Line | Severity | Message                                                   |
| -------------------------------------- | ---- | -------- | --------------------------------------------------------- |
| `src/lib/components/FilePicker.svelte` | 71   | WARNING  | `` `<div>` with a click handler must have an ARIA role `` |

Same as the unit-test warning — the only actual warning in the frontend codebase.

### Pre-existing infrastructure errors (not actionable)

These are reported by `svelte-check` because it type-checks the E2E files without WebdriverIO's global type shims. They existed before any recent changes and are expected.

| File                                           | Issue                                                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.js:4`                             | Unused `@ts-expect-error` directive                                                                                                 |
| `tests/e2e/wdio.conf.ts:9`                     | Cannot find namespace `WebdriverIO`                                                                                                 |
| `tests/e2e/wdio.conf.ts:20`                    | Unused `@ts-expect-error` directive                                                                                                 |
| `tests/e2e/specs/splashscreen.ts` (many lines) | `describe`, `it`, `before`, `after`, `browser`, `$`, `$$`, `expect` not found — WebdriverIO globals not injected at type-check time |
| `tests/e2e/specs/studio.ts` (many lines)       | Same as above                                                                                                                       |

**Root cause:** `svelte-check` picks up `tests/e2e/**/*.ts` but the WebdriverIO type shims are only available when the test runner bootstraps (via `@wdio/globals` / `@wdio/mocha-framework`). These errors pre-date this session and do not affect running tests.

---

## IDE TypeScript Diagnostics (`studio.ts` — `'await' has no effect`)

The harness reports `'await' has no effect on the type of this expression. [80007]` on many lines in `tests/e2e/specs/studio.ts`.

**Root cause:** WebdriverIO's `$(selector)` returns a `ChainablePromiseElement` whose TS type is not a plain `Promise`, so TypeScript believes `await` is redundant. In practice `await` is required for correct async sequencing. This warning appears on every `await $(...)` call in the file — the pattern was present before this session and is endemic to WebdriverIO + strict TypeScript.

**Not introduced by this session.** The new drag-reorder suite follows the same `await $(...)` pattern as all existing suites.

---

## Summary

| Suite                     | Result     | Actionable warnings                                                       |
| ------------------------- | ---------- | ------------------------------------------------------------------------- |
| Unit (Vitest)             | ✅ 126/126 | 1 pre-existing a11y warning in `FilePicker.svelte`                        |
| Rust (cargo test)         | ✅ 23/23   | None                                                                      |
| TypeScript (svelte-check) | ⚠️ errors  | All E2E errors are pre-existing WebdriverIO type-shim gap; 1 a11y warning |

The only warning worth addressing is the **`FilePicker.svelte` a11y ARIA role** — add a `role="button"` (or replace the `<div>` with a `<button>`) to silence it across all three suites.

---

## Background: Why the E2E Type Errors Exist

When `pnpm test:e2e` runs, WebdriverIO injects globals (`browser`, `$`, `$$`, `describe`, `it`, `expect`) at **runtime**. Your test code uses them without imports because the runner guarantees their presence.

This injection is purely a runtime concern. The TS compiler only knows about globals that appear in a `.d.ts` file in scope. WebdriverIO ships `@wdio/globals` with proper type declarations, but those are wired up inside WebdriverIO's own type environment — not the root `tsconfig.json` that `svelte-check` and the IDE LSP use.

So from `svelte-check`'s perspective, `browser`, `$`, `$$`, `describe`, `it`, and `expect` are simply undeclared — hence the flood of errors. The `'await' has no effect [80007]` hints follow the same pattern: `$(selector)` returns a `ChainablePromiseElement` whose type resolves differently without WebdriverIO's tsconfig, making TS think `await` is redundant.

None of this affects the actual E2E run — WebdriverIO compiles the specs with its own type environment where everything is correctly declared.

### Standard fix

The idiomatic solution is two tsconfigs:

**Root `tsconfig.json`** — exclude `tests/e2e/`:

```json
{ "exclude": ["tests/e2e"] }
```

**`tests/e2e/tsconfig.json`** — extend root, add WebdriverIO types:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "types": ["@wdio/globals/types", "@wdio/mocha-framework"]
  },
  "include": ["./**/*.ts"]
}
```

The alternative — adding WebdriverIO types to the root tsconfig — pollutes the frontend environment with `browser`, `$`, etc., which could mask real bugs in Svelte components. Separate tsconfigs per environment is the standard approach, especially in Tauri projects where `src/` and `tests/e2e/` run in fundamentally different runtime contexts.

**Not addressed yet** — deferred, captured here for reference.
