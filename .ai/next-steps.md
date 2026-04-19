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
- [x] Limit deduplicate frames features to current selection if multiple frames are selected
- [x] Press Ctrl + A to select all frames
- [ ] Use Ctrl + mouse wheel to zoom in and out
- [ ] Improve keyboard controls
- [ ] Fix bug where loaded GIF sometimes disappears
- [ ] Improve delete multi-frame hover button
- [ ] Add frame inspector side bar

### Prompt planning

#### Add frame inspector side bar

When no GIF is loaded, the bar should be visible but just say "No frame selected". When a GIF is loaded, there is always a frame selected (default is first frame), so this frame should be selected for the inspector too. The inspector window provides additional insights and controls that apply to only the selected frame(s).

When a single frame is selected, the frame inspector should:
- Show frame number
- Show frame duration
- Allow changing frame duration
- Allow duplicating frame
- <TBC>

You must implement this using your `tdd` skill. Also, please write and E2E test for this feature. E2E tests for deduping already exists.

#### Improve keyboard support

Status: **In progress**

Can you plan how to improve keyboard/mouse support and a form of zoom level indicator in my application? My goal is to retain current keybindings (e.g. Ctrl + A to select all frames) and add the following new ones:
- Left/right should move the current frame selection to the left/right while a GIF is loaded, otherwise nothing
- Page up/down should scroll the timeline left/right
- Delete should remove the current selection
- Shift + left/right should expand/reduce the frame selection towards the left/right
- Space should start playback while its stopped and stop it while its playing
- Ctrl + mouse wheel should zoom in/out the current frame in the main section
- While a GIF is loaded, you should be able to move it around the main frame wile holding the right mouse button or while holding Shift + left mouse button
- When changing the current frame, the position and zoom level of the image should remain modified (if it was modified) instead of resetting
- We need some kind of zoom level indicator that has at least two features: a) it displays the current zoom level as an indicator and b) as soon as the zoom level or position of the GIF has been modified by the user, it should show a "reset" button/icon
  - This indicator should be shown as a small number at the top right of the main section
  - It should only be visible once a GIF has been loaded; the indicator should not be visible if no GIF is loaded
  - Between the indicator and the tool bar as well as the right side of the window should be a small gap of about 10px
  - The indicator should have the same background colour as the timeline, and the same small border with the same border colour
  - It should be on top of any GIF if the frame is zoomed in to a degree where it no longer fits the screen without overlapping with the indicator 
  - If you can create icons, I strongly encourage you to use icons such as a magnifying class and some form of icon for the reset button

If required, feel free to do web research for anything where your output could be improved by it.

You must implement this using your `tdd` skill. Also, please write and E2E test for this feature. E2E tests for deduping already exists.

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
