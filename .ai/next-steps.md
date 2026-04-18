# Next steps

## Features

### POC

Status: **Completed**

- [x] Create full-stack E2E tests
- [x] Fix: `Failed to open file dialog: Failed to send open dialog request: A portal frontend implementing `org.freedesktop.portal.FileChooser` was not found`
- [x] Allow drag-and-drop GIF into main section to open GIF
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
- [ ] Limit deduplicate frames features to current selection if multiple frames are selected
- [ ] Press Ctrl + A to select all frames
- [ ] Use Ctrl + mouse wheel to zoom in and out
- [ ] Fix bug where loaded GIF sometimes disappears
- [ ] Improve delete multi-frame hover button

### Planning

#### Improve delete multi-frame hover button

In my app, a user can load a GIF and then modify it.  While a GIF is loaded, a timeline is visible. On the timeline, all frames of the open GIF are showed. When hovering over a frame with the mouse, an (x) button appears allowing the user to delete the frame. The user can also select multiple frames and hover over the current frame to then see the (x) button to delete plus a number indicating the number of frames that are selected and would be deleted. In the case of bulk selecting/deleting frames, the (x) plus number badge are currently displayed on all frames while the user hovers specifically over the delete button of any of the frames in the selection. I don't like it. When hovering over (x) plus number badge of a frame while multiple frames are selected, don't show the (x) plus number badge on all frames - only show it on the frame over which the mouse is hovering. Don't change any other functionality of behaviours. Use your `tdd` skill when writing code. Run all unit test, all Rust tests and all E2E test to make sure you didn't break anything.

#### Limit deduplicate frames features to current selection if multiple frames are selected

Status: **In progress**

My app has a feature that allows to deduplicate the frames in a GIF image. While a GIF is loaded, the tool bar shows to buttons for two different versions of this deduplication function. I would like you to improve both in a way where, when the user has selected _multiple_ frames, these dedup functions only apply to the selection. If the user has selected a single frame only, then the functions should apply to all frames.

You must implement this using your `tdd` skill. Also, please write and E2E test for this feature. E2E tests for deduping already exists.

#### Press Ctrl + A to select all frames

My app has a timeline that shows all frames of a GIF when a GIF is loaded. A user can select multiple frames by shift + left clicking on another frame. This will cause all frames between and incl. the current frame and (including) the clicked frame to be selected. I would like you to allow a user to select all frames by pressing Ctrl + A on their keyboard.

Please create a plan that uses `tdd` to replicate each issue before attempting to fix it. Run all unit tests, all E2E tests, and all Rust tests to make sure you didn't break anything.

## Goals

### UI / Views

#### Recorder UI

- Options: number of frames, capture mode (fullscreen with monitor selection / window / select area)
- Visual pause/continue and stop controls during recording

#### Studio UI — three sections:

- Toolbar at the top
- Main viewer — current frame rendered to canvas
- Timeline at the bottom — scrollable strip of frame thumbnails in sequence

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
- Possibly: mouse movement highlight, key press visualisation, image overlay

## Key Constraints

- Linux + Wayland (Hyprland) is the must-have target
- Cross-platform (Windows, macOS) is a goal but not a day-one requirement
- No cloud, no third-party APIs
