# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Duration display for multi-select with mixed durations

When multiple frames are selected and they have different durations, what should the duration input show? Options:
1. Show the anchor frame's duration (the first selected frame)
2. Show blank/empty
3. Show placeholder text like "Mixed" (read-only until user types)

Typing a new value would set all selected frames to the same duration regardless.

### Response

If possible, show a placeholder like "Mixed" but when clicking the field, the text disappears and the user can only enter digits themselves. If this is disproportionally complicated or impossible to achieve, can you leave it empty.
<!-- Processed -->

## Q2: Inspector panel width

What fixed width should the inspector panel have? Roughly 240–280px seems right for the content described, but do you have a preference?

### Response

Yes, let's go for 240px. If that doesn't look good, we can change it later.
<!-- Processed -->

## Q3: Duplicate frames — ID generation

When duplicating frames, the new frames need unique IDs. The existing codebase uses simple string IDs (e.g. from the GIF decoder). Should I use `crypto.randomUUID()` for new IDs, or is there a preferred approach?

### Response

I don't know what the pros/cons are of any option we have. Can you please provide more detail? I don't know if we can break any existing functionality or if certain options will make exporting a GIF difficult, etc.
<!-- Processed -->

## Q4: Duplicate frames — ID generation (follow-up from Q3)

After investigating: frame IDs are **purely frontend** — they're used as Svelte `{#each}` keys, in selection tracking (`selectedFrameId`, `selectedFrameIds`), and as `data-frame-id` DOM attributes. During GIF export, IDs are stripped — only `imageData` and `duration` are sent to Rust (see `actions.ts:71-74`).

This means any unique string works and there's zero risk to export or existing functionality. `crypto.randomUUID()` is the standard browser API for this — it generates a UUID like `"f47ac10b-58cc-4372-a567-0e02b2c3d479"`. It's available in all modern browsers and in Tauri's WebView.

I'll proceed with `crypto.randomUUID()` unless you object.

### Response

Sounds good, thanks for confirming.
<!-- Processed -->
