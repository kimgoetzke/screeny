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
- [ ] Down show header bar (min/max or close window) during splash screen
- [ ] Add on-hover button effect(s) for timeline
- [ ] Allow bulk-deleting frames
- [ ] Allow moving frames

### Planning

#### Improvement to tool b1ar

<TBC>

#### Improvements to timeline

##### Add on-hover button effect(s) for timeline

When a user hovers over a frame, a button to delete the frame is visible which is correct. What is missing though is that when the user hovers over this (x) button, there's no on-mouse-over effect. Please add one in-line with the colour theme.

##### Allow bulk-deleting frames

It must be possible to Shift + Left mouse click a frame in the time line to select _all_ frames from (and including) the currently selected frame up until (and including) the clicked frame:

- The delete button that's visible on hover must then be shown on all visible frames that are selected whenever the user hovers over just one
- When the user hovers over a button the same on-mouse-over effect applies to buttons on all selected & visible frames, indicating that the action will be applied to all frames

##### Allow moving frames

Users must be able to move one or more frames by dragging and dropping it/them in the timeline:

- Example: Moving the first frame after the second frame must change the order of the frames being displayed in the timeline but also when playing the GIF using the Play button
- Shift + Left mouse clicking a frame in the timeline that is different from the current frame, multiple frames are selected (all frames from current to the clicked frame)
  - When multiple frames are selected, and moved with the mouse to a different location, all frames most be moved
  - The order of the selected frames must stay the same e.g. if you move 1 + 2 + 3 after frame 4 then 1 -> 2 (because 4 is now 1 and 1 + 1 = 2), 2 -> 3, 3 -> 4 and 4 -> 1 (because it is now the first frame)

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

#### Phase 1 — Studio MVP (start here)

- Open existing GIF
- Frame management: delete frames, reorder frames, change per-frame duration
- Export GIF (with size and quality options via gifski)
- Save/load project files (JSON metadata + cached frame data)

#### Phase 2 — Recording

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
