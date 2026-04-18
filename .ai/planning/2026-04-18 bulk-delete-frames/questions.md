# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Visual indicator for bulk delete (beyond showing all delete buttons)

The user specified: when hovering any selected frame, all selected frames' delete buttons must be visible and show the same hover effect. This already communicates "all will be deleted" to some degree.

Research suggests two complementary patterns would strengthen the signal without adding dialogs or extra clicks:

**Option A — Red tint overlay on all selected frames**
When the cursor enters *any* delete button, all selected frames simultaneously get a semi-transparent red overlay (e.g. `rgba(220, 38, 38, 0.25)`), directly previewing their deletion scope. On mouse-leave the tint disappears. This is the most visually explicit approach.

**Option B — Count badge on the delete button**
When >1 frames are selected, each delete button shows a small badge (e.g. `3` or `×3`) indicating it will delete that many frames. This is always visible (not hover-gated) and gives numeric context with zero extra clicks.

**My recommendation:** Combine both — red tint on hover + static count badge when selection > 1. The tint makes the scope feel visceral and immediate; the badge adds precision. Both are purely visual and involve no dialogs.

Which approach do you want?
- A) Red tint only
- B) Count badge only
- C) Both (recommended)
- D) A different approach entirely (please describe)

### Response

C — both red tint overlay on all selected frames on delete hover + count badge on delete button when >1 frames selected.
