# Next steps

## Features

### POC

Status: **Completed**

- [x] Create application skeleton
- [x] Replace white startup with small, themed splash screen
- [x] Show three sections: tool bar, main section, timeline
- [x] Allow opening and saving GIFs
- [x] Allow drag-and-drop GIF into main section to open GIF
- [x] Show GIF frames in timeline
- [x] Create full-stack E2E tests
- [x] Fix: `Failed to open file dialog: Failed to send open dialog request: A portal frontend implementing `org.freedesktop.portal.FileChooser` was not found`
- [x] Improve styling
- [x] Improve GIF loading speed

### V1

Status: **In progress**

- [x] Introduce a generic, re-usable notification dialog
- [x] Change Open button to Close button while a GIF is opened
- [ ] Fix hanging right after GIF is selected/dropped and before it loads
- [x] Don't show header bar (min/max or close window) during splash screen
- [x] Add on-hover button effect(s) for timeline
- [x] Allow bulk-deleting frames
- [x] Allow moving frames
- [x] Deduplicate frames
- [x] Limit deduplicate frames features to current selection if multiple frames are selected
- [x] Press Ctrl + A to select all frames
- [x] Use Ctrl + mouse wheel to zoom in and out
- [x] Improve keyboard controls
- [ ] Fix bug where loaded GIF sometimes disappears
- [x] Improve multi-frame delete button hover
- [ ] Add inspector side bar
- [ ] Remove dedup buttons from the tool bar

### Prompt planning

#### Remove dedup buttons from the tool bar

We have recently implemented a inspector panel. This is the dedicated place for "frame management" and as such the dedup buttons in the top toolbar feel redudant. Can you please remove them? Don't remove the underlying functionality though since it is used by dedup buttons in the inspector panel.

#### Add inspector side bar

Status: **In progress**

I would like you to plan an "inspector" side panel for my application.
- When no GIF is loaded, the panel should be visible but just say "No frame selected"
- When a GIF is loaded, there is always a frame selected (default is first frame), so this frame should be selected for the inspector too
- The inspector window provides additional insights and controls that apply to only the selected frame(s)
- It has a title at the top that says "Inspector"
- When a single frame is selected it indicates "Frame x of z" where x is the number of the frame and z is the last frame in the GIF
- When multiple frames are selected is indicates "Frames x - y of z" where x is the first frame in the selection, y is the last frame in the selection and z is the last frame in the GIF
- When multiple frames are selected, there should also be a colour indicator below the above e.g. a tag saying "Bulk edit" but other suggestions welcome
- Any actions taken in the inspector apply to all selected frames, so when multiple frames are selected, any action is a bulk-action (hence the tag above)
- To begin with, the info shown and actions available in the inspector are extremely limited, we'll build on it over time
- The first action you can take is change the frame duration, so we need a section that allows you do do that
  - The current frame duration should be shown
  - The unit (i.e. ms) should be visible but it should not be possible to change it
  - However, the user can increase the duration down to 1 and up to 9999 by typing a number
  - It should also be possible to change the number by using the mouse wheel over the duration input field: one "tick" in the scroll wheel should increase/decrease by 1; doing the same while holding Shift should increase/decrease by 100
- Next, we want to display the two dedup buttons from the top tool bar here but only when multiple frames are selected
  - Clicking any of them will only apply the respective dedup function to the selection, not all frames
- Then there should be a row of buttons
  - One button should be the typical duplicate icon
    - Clicking this icon should duplicate the frame by adding the duplicate to the right of the current frame
    - Clicking this icon while multiple frames are selected should duplicate the entire selection and insert it to the right of the current selection
  - Then we need a bin icon that allows you to delete the frame(s) 
- It bottom right of there should be an icon looking like "->|" that allows the user to minimise the inspector
- While the inspector is minimised the icon should reverse to a "|<-" which, when clicked, will restore the inspector panel again
- When minimising the panel by clicking "->|", the panel should move out of sight to the right until only enough space for the "restore" button is left so that the screen is almost but not entirely clear and the button should transform into the "|<-" button

Feel free to do web research on anything that you want to confirm against best practice, for example.

You must implement this using your `tdd` skill. Also, please write and E2E test for this feature. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression.

**Improvements 1**

The implementation is technically done but there are still some problems:
- Inspector panel shjould be "floating"; it should have rounded corners and there should be a gap between it and the top toolbar, the right side of the window, and the buttom timeline
- The zoom indicator is overlapping with the inspector panel but it should be always 20px on the left of it regardless of when it's closed or opened
- Minimising the inspector panel also doesn't work as expected:
  - The icon at the top when visible and at the bottom when minimised but the icon should stay at the bottom at all times
  - The icon is not a real icon but text which is particularly visible when you look at the arrow, can you make it the industry standard icon for moving a pane in and out (i.e the icon version of "->|" and "|<-"?
- The bulk edit tag should not be 100% of the width but just as wide as the text
- The duration text should be in the same like as the editable field and be normal case and read "Duration:" 
- The duration row therefore contains the text, the field and the "ms" unit; all of which should always be stretched to 100%

Can you please extend the existing plan to address them?

You must implement this using your `tdd` skill. Also, please write and E2E test for this feature. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression.

**Improvements 2**

Can you please extend the existing plan with the follwing additional improvements and bug fixes?

- Pressing `Ctrl` + `I` should toggle the state of the inspector between minimised and fully visible
- The arrow up/down buttonns inside the frame duration field where you can change the duration should be styled consistently with the rest of the buttons in this app (currently it has some default styling that looks out of place)
- The icon to minimise/fully show the inspector panel is horizontally centered at the bottom but it should be at the right, in the exact position where it'll be when the inspector panel is minimised so that you can effectively keep clicking at the same place to toggle the visibility of the panel back and forth
- Please show the "Frame x of y" text at the top of the panel in all caps
- Please add a lot more spacing between the elements in the inspector (except for the title, the title is perfect in every was as-is)
- Can you please change the widths of the duplication and delete buttons to be of equal width while filling the full widths of the inspector panel?
- The drag-and-drop indicator for opening a GIF overlaps with the inspector panel which looks wrong
  - Option 1: Exclude the inspector panel for the drag-and-drop indicator area but this requires automatically adjusting based on whether the inspector panel is visible or not
  - Option 2: Reduce the drag-and-drop area indicator's size to be centered and of equal widths and height but without ever overlapping with the inspector panel (this means dynamically adjusting the size as the application window as it grows or shrinks too)
  - Please choose whichever you have higher confidence in achieving well
- Using the mouse wheel to expand/reduce the frame duration while hovering over the frame duration field works but holding `Shift` while scrolling was supposed to increase/reduce the duration in increments of 100 per "scroll tick" which does not work; instead it causes the duration to drop to exactly 1 and not move, regardless in which direction you scroll; please fix this!

You must implement this using your `tdd` skill. Also, please write and E2E test for this feature. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression.

## Goals

### UI / Views

#### Recorder UI

- Options: number of frames, capture mode (fullscreen with monitor selection / window / select area)
- Visual pause/continue and stop controls during recording

### Planned Features (roughly by priority)

#### Phase 1 — Studio V1

- Open existing GIF
- Frame management: delete frames, reorder frames, change per-frame duration
- Export GIF (with size and quality options via gifski)
- Save/load project files (JSON metadata + cached frame data)

#### Phase 2 — Recording V1

- Recorder UI with capture mode selection
- Rust backend: PipeWire + xdg-desktop-portal (ashpd) for Wayland capture
- Pause/resume/stop controls

#### Phase 3 — Advanced Studio Features

- Import frames from other GIFs
- Text overlay
- Crop / resize
- Highlight mouse movement highlight
- Key strokes overlay
- Image overlay

## Key Constraints

- Linux + Wayland (Hyprland) is the must-have target
- Cross-platform (Windows, macOS) is a goal but not a day-one requirement
- No cloud, no third-party APIs
