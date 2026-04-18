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
- [x] Press Ctrl + A to select all frames
- [ ] Use Ctrl + mouse wheel to zoom in and out
- [ ] Fix bug where loaded GIF sometimes disappears
- [ ] Improve delete multi-frame hover button
- [ ] Add frame inspector side bar
- [ ] Improve keyboard controls

### Prompt planning

#### Limit deduplicate frames features to current selection if multiple frames are selected

Status: **In progress**

My app has a feature that allows to deduplicate the frames in a GIF image. While a GIF is loaded, the tool bar shows to buttons for two different versions of this deduplication function. I would like you to improve both in a way where, when the user has selected _multiple_ frames, these dedup functions only apply to the selection. If the user has selected a single frame only, then the functions should apply to all frames.

You must implement this using your `tdd` skill. Also, please write and E2E test for this feature. E2E tests for deduping already exists.

#### Add frame inspector side bar

When no GIF is loaded, the bar should be visible but just say "No frame selected". When a GIF is loaded, there is always a frame selected (default is first frame), so this frame should be selected for the inspector too. The inspector window provides additional insights and controls that apply to only the selected frame(s).

When a single frame is selected, the frame inspector should:
- Show frame number
- Show frame duration
- Allow changing frame duration
- Allow duplicating frame
- <TBC>

#### Improve keyboard support

- Left/right should move the current frame selection to the left/right while a GIF is loaded, otherwise nothing
- Page up/down should scroll the timeline left/right
- Delete should remove the current selection
- Shift + left/right should expand/reduce the frame selection towards the left/right
- Space should start playback while its stopped and stop it while its playing

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
