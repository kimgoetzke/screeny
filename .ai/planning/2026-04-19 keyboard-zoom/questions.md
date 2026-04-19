# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Arrow key wrap vs clamp

Should arrow key navigation (Left/Right) wrap around at boundaries (last→first, first→last) or stop at the edge? I've assumed **clamp** (stop at boundary) since that's conventional for editors, and playback already handles wrapping separately. Does that match your preference?

### Response

Yes, that's fine. Thank you!
<!-- Processed -->

## Q2: Zoom centre point

When zooming with Ctrl+wheel, should the zoom centre on the **mouse cursor position** (like Figma/Photoshop — zoom towards where the cursor points) or on the **centre of the viewer** (simpler, always zooms symmetrically)? Cursor-centred zoom is more natural but slightly more complex. My default is **cursor-centred**.

### Response

Let's please go for the cursor-centred Zoom.
<!-- Processed -->

## Q3: Shift+Arrow selection expansion direction

For Shift+Left/Right, the plan extends from the **edge of the current selection range** (standard file-manager behaviour). This means Shift+Right always adds the frame after the rightmost selected frame, regardless of where `selectedFrameId` (anchor) is. Is that correct, or should it extend from the anchor (so Shift+Right from frame 3 with frames 3-5 selected would deselect frame 5)?

### Response

You are making the right assumption here: we should extend from the **edge of the current selection range** (standard file-manager behaviour).
<!-- Processed -->

## Q4: Timeline auto-scroll on arrow key navigation

When pressing Left/Right to navigate frames, should the timeline **auto-scroll** to keep the newly selected frame visible? This is nice UX but adds complexity. My default is **yes, auto-scroll into view**.

### Response

Yes, please do auto-scroll into view!
<!-- Processed -->
