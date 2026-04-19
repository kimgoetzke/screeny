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
