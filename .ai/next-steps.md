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
- [x] Fix bug where loaded GIF sometimes disappears
- [x] Improve multi-frame delete button hover
- [x] Add inspector side bar
- [x] Remove dedup buttons from the tool bar
- [ ] Improve toolbar
- [ ] Add background grid
- [ ] Fix "Loading 0%" visible as soon as you click "Open"
- [ ] Hide inspector until GIF loaded
- [ ] Add inspector buttons to move frame(s)

### Prompt planning

#### Add inspector buttons to move frame(s)

Please plan the work to add 4 new inspector buttons to move the selected frame(s):
- The buttons should be displayed in a single row
- This new row of buttons should be located above the duplicate/delete button row
- The first button should move the selected frame(s) to the far left
- The second button should move the selected frame(s) by a single frame to the left
- The third button should move the selected frame(s) by a single frame to the right
- The fourth button should move the selected frame(s) to the far right
- All buttons should be have the standard icons for this purpose

Please move the existing duplicate/delete button row and this row to the bottom of the inspector panel.

If you need to do web research, please do.

You must implement this using your `tdd` skill. Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. Also, please write and E2E test for this feature. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression.

#### Improve toolbar

Please plan improvements to the toolbar. 

First, we need a help menu. This menu should be accessible via a button that is located at the top right of the tool bar and should have a question mark icon.
- When clicking the button, an overlay menu should open
- The menu should show the current version of the application
- There should be one button that is the GitHub icon; there should be text explaining that the user can get help or raise issue there; clicking it should open https://github.com/kimgoetzke/screeny
- Another section should be a table that lists the key bindings
  - The table shows a list of key bindings in a table with the columns Context (e.g. Global, Inspector, Timeline), Binding, and Action
  - For this you'll need to identify all key bindings we have configured so far and list them here please

Second, can you please position the payback icons always horizontally centered in the tool bar.

<TBC>


You must implement this using your `tdd` skill. Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression.

---

Also, please write and E2E test for this feature.

You must implement this using your `tdd` skill. Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application with 

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
