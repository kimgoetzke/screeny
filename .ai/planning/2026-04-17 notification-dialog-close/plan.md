# Task Plan: Notification Dialog & Close Button

## Goal

Create a generic reusable `NotificationDialog` Svelte component and add a "Close" toolbar button (replacing "Open" when a GIF is loaded) that uses the dialog to confirm before clearing the project.

## Current Phase

Complete

## Phases

### Phase 1: Create `NotificationDialog` component

- [x] Create `src/lib/components/NotificationDialog.svelte` with props: `message`, `confirmLabel`, `cancelLabel?`, `onConfirm`, `onCancel?`
- [x] Renders a fixed full-screen backdrop with a centred dialog box
- [x] 1-button mode when `cancelLabel` is absent; 2-button mode when present
- [x] 2-button mode: backdrop click and Escape key both invoke `onCancel`; 1-button mode: neither dismisses the dialog
- [x] Style consistent with existing theme CSS variables
- [x] Create `src/lib/components/NotificationDialog.test.ts` with SSR-render tests (8 tests, all passing)
- [x] Run tests; fix failures
- [x] Update planning files per the `planning` skill
- **Status:** complete

### Phase 2: Modify `Toolbar.svelte` for Close button

- [x] Import `NotificationDialog` in `Toolbar.svelte`
- [x] Add `let showCloseConfirm = $state(false)`
- [x] Replace always-visible Open button with conditional: show Open when `!frameStore.hasFrames`, show Close when `frameStore.hasFrames`
- [x] `handleClose()`: sets `showCloseConfirm = true`
- [x] On dialog confirm: `frameStore.clear()`, `showCloseConfirm = false`
- [x] On dialog cancel: `showCloseConfirm = false`
- [x] Render `{#if showCloseConfirm}<NotificationDialog .../>{/if}` at top of toolbar template (same position as FilePicker)
- [x] Update `Toolbar.test.ts`: added 4 tests for Open/Close button visibility toggling (all passing)
- [x] Run tests; fix failures
- [x] Update planning files per the `planning` skill
- **Status:** complete

## Key Questions

1. ~~Should the dialog be dismissible by clicking outside/pressing Escape?~~ **Resolved:** 2-button mode yes (= cancel); 1-button mode no.

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| 1 component, optional `cancelLabel` for 1-button vs 2-button | Single component is simpler than two; optional prop makes the distinction clear |
| `{#if showCloseConfirm}` in Toolbar, not a global store | Keeps dialog state local to the trigger; avoids global modal management complexity |
| Open/Close are mutually exclusive (one replaces the other) | Spec requirement; cleaner UX than showing both |
| 2-button mode: backdrop click + Escape = cancel; 1-button mode: neither dismisses | Confirmed by user (Q1). Prevents accidental dismissal of acknowledge-only dialogs. |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       | 1       |            |

## Notes

- Follow `tdd` skill for all code written
- Follow `rust-standards` does NOT apply — this is Svelte/TypeScript; use existing Svelte patterns
- Test pattern: SSR render (`render(Component)`) + body string matching — see `Toolbar.test.ts`
- Theme variables: `var(--color-bg-elevated)`, `var(--color-border)`, `var(--color-accent)`, `var(--color-text-brightest)`, `var(--color-text-muted)`, `var(--color-surface)`
- Update phase status as you progress: pending → in_progress → complete
- Log ALL errors — they help avoid repetition
