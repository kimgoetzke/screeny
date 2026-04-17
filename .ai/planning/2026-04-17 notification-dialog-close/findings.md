# Findings & Decisions

## Plan Size

**Multi-phase: Yes**  
Reasoning: 4 files will be created/modified (`NotificationDialog.svelte` new, `Toolbar.svelte` modified, `Toolbar.test.ts` modified, `NotificationDialog.test.ts` new) and the total change is expected to exceed 150 lines.

## Requirements

- Generic, reusable `NotificationDialog` Svelte component:
  - Displays a short message/question (multi-line support)
  - 1-button mode: single "OK"-style button
  - 2-button mode: cancel + confirm buttons (e.g. "Cancel" / "Continue")
  - Message text, button count, and button labels are all customisable
- Toolbar changes:
  - While no GIF is open (`!frameStore.hasFrames`): show "Open" button as today
  - While a GIF is open (`frameStore.hasFrames`): hide "Open", show "Close" button instead
  - Clicking "Close" shows `NotificationDialog` with:
    - Message: "Any unsaved changes will be lost. Do you want to continue?"
    - Buttons: "Cancel" (left) + "Continue" (right)
    - Confirming calls `frameStore.clear()`

## Research Findings

### Current architecture

- **Framework**: Svelte 5 (runes syntax — `$state`, `$props`, `$derived`)
- **Toolbar.svelte** (`src/lib/components/Toolbar.svelte`): manages Open, Export, Play, Stop buttons. Uses `frameStore.hasFrames` already to conditionally show Play/Stop. Open button is always rendered.
- **frameStore** (`src/lib/stores/frames.svelte.ts`): already has `clear()` which stops playback, resets frames, resets loading state. This is exactly what Close needs to call.
- **FilePicker.svelte**: existing conditional-render modal pattern — rendered with `{#if showFilePicker}`, receives `onConfirm`/`onCancel` callbacks. `NotificationDialog` should follow the same pattern.
- **Toolbar.test.ts**: uses `render()` from `svelte/server` + `frameStore` manipulation. SSR-render + string matching for assertions. New tests should follow this pattern.

### Toolbar conditional rendering (current)

```svelte
<!-- Open button always shown -->
<button onclick={handleOpen} disabled={loading} data-testid="btn-open">Open</button>

<!-- Play/Stop only when hasFrames -->
{#if frameStore.hasFrames}
  <button ...>▶</button>
  <button ...>■</button>
{/if}
```

Close replaces Open when `frameStore.hasFrames`. The condition is already available.

### Dialog/modal pattern (FilePicker precedent)

```svelte
{#if showFilePicker}
  <FilePicker onConfirm={handleFilePickerConfirm} onCancel={handleFilePickerCancel} />
{/if}
```

`NotificationDialog` will render identically — a full-screen overlay rendered at the root of `Toolbar.svelte`'s template.

## Technical Decisions

| Decision | Rationale |
| -------- | --------- |
| `NotificationDialog` is a Svelte component, not a store-driven modal system | Keeps complexity minimal; sufficient for current needs |
| Conditional render (`{#if}`) not slot/portal | Consistent with existing `FilePicker` precedent in this codebase |
| Props: `message`, `confirmLabel`, `cancelLabel?`, `onConfirm`, `onCancel?` | `cancelLabel` optional makes 1-button vs 2-button the same component; if absent, only confirm button shown |
| Overlay is a `position: fixed` full-screen backdrop with centred dialog box | Standard modal UX; prevents interaction with underlying UI while open |
| Close button replaces Open (not shown alongside) when `frameStore.hasFrames` | Matches spec; cleaner toolbar without two conflicting actions visible |
| `frameStore.clear()` is called on confirm | Already exists, handles stop + reset |
| Backdrop click / Escape dismisses in 2-button mode (treated as cancel); no dismiss in 1-button mode (must press OK) | Confirmed by user (Q1). Prevents accidental dismissal of acknowledge-only dialogs while keeping cancel-flow convenient. |

## Issues Encountered

| Issue | Resolution |
| ----- | ---------- |
|       |            |

## Resources

- `src/lib/components/Toolbar.svelte` — button layout and state
- `src/lib/components/FilePicker.svelte` — modal precedent
- `src/lib/stores/frames.svelte.ts` — `hasFrames`, `clear()`
- `src/lib/components/Toolbar.test.ts` — test pattern (SSR render + string match)

## Visual/Browser Findings

_N/A — no images reviewed._

---

_Update this file after every 2 view/browser/search operations_
_This prevents visual information from being lost_
