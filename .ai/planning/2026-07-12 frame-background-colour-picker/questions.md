# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Implementation defaults approval

Please confirm the proposed defaults before implementation:

- Use `svelte-awesome-color-picker` as the first-choice library.
- Store `backgroundColour` plus content bounds metadata on frames, keeping default black (`#000000`) padding.
- Show the picker for full-canvas frames too; keep it enabled, with helper text explaining that the colour has no visible effect when all selected frames fill the canvas.
- For mixed selections, apply one selected colour to every selected frame; padded frames visibly change and full-canvas frames remain visually unchanged.

These choices affect data shape, UI copy, and E2E expectations.

### Response

Confirmed.
<!-- Processed -->

## Q2: Existing test modifications/removals

No existing tests are currently planned for removal or behavioural weakening. The plan is to add new tests and preserve the existing black-default import assertion.

If implementation later appears to require modifying or removing any existing test, work must stop and this file must be updated with every affected test, why it would change, and an explicit confirmation request.

### Response

You appear to be stating the obvious. There doesn't seem to be a question.
<!-- Processed -->

## Q3: Follow-up picker placement option

Research currently recommends Option B: an embedded compact picker, shown on demand below the background colour field, using the package's `isDialog={false}` mode plus app-themed CSS variables and constrained dimensions. This appears easier and more robust than an overlay/portal because the installed package has no portal support.

Please confirm if you want Option B, or say if you prefer Option C: an app-owned overlay that opens left into the canvas above the Inspector.

### Response

Option B.
<!-- Processed -->
