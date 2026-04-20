# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Disabled state on edge buttons

Should the move-left / move-to-start buttons appear visually disabled when the selection is already at position 0, and move-right / move-to-end when already at the last position?

The plan currently treats these as no-ops (clicking does nothing). Adding disabled state would be a cleaner UX but requires more logic in the component.

### Response

