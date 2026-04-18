# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Non-contiguous selection behaviour

When the user has a non-contiguous selection (e.g. frames 0 and 3 selected, with frames 1 and 2 unselected), and runs dedup on that selection, the dedup algorithm compares frames 0 and 3 as if they are adjacent. Is this the intended behaviour, or should the dedup only consider frames that are actually adjacent in the full frame list?

The chosen implementation emits the dedup'd selection block at the position of the first selected frame. This means that for [A(sel), B, C, D(sel)] where A ≠ D, nothing changes (no adjacent duplicates in the selection). This seems sensible but wanted to confirm.

### Response

Yes, I agree with your approach.
<!-- Processed -->
