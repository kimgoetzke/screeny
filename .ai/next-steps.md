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
- [ ] Don't show header bar (min/max or close window) during splash screen
- [x] Add on-hover button effect(s) for timeline
- [x] Allow bulk-deleting frames
- [ ] Allow moving frames
- [ ] Deduplicate frames
- [ ] Limit deduplicate frames features to current selection if multiple frames are selected
- [ ] Press Ctrl + A to select all frames

### Planning

#### Improvement to tool b1ar

<TBC>

#### Improvements to timeline

##### Allow bulk-deleting frames

Please help me implement a new feature in my GIF manipulation app. When a user
loads a GIF, a timeline is displayed at the bottom of the app which shows each frame of the GIF. This way the user can delete a frame by selecting them and clicking an (x) icon which appears in the top right corner of the frame over which they hover. I want to extend this by allowing users to bulk delete frames. For this, it must be possible to Shift + Left mouse click a frame in the time line to select _all_ frames from (and including) the currently selected frame up until (and including) the clicked frame. This must work in both directions i.e. clicking a frame before or after the current frame. When the current frame is clicked, the current frame should remain selected and no other frames should be added to the selection.

The first use case for this bulk select ability is a bulk-delete feature for frames:

- The delete button (x) that's currently visible on hover must be shown on all visible frames that are selected (whether that's just one or multiple) whenever the user hovers over just one of them
- When the user hovers over a button the same on-mouse-over effect applies to buttons on all selected & visible frames, indicating that the action will be applied to all frames
- If you have better, more best practice ideas to indicate that all frames are being deleted when the (x) of one is clicked, please do propose it as a question; web research for this is acceptable; however, I want to exclude a notification dialog that tells the user that all frames will be deleted as this adds extra clicks to the journey; the indication must be purely visual
- Use your tdd skill for the implementation

##### Allow moving frames

Please help me implement a new feature in my GIF studio app. When a user
loads a GIF, a timeline is displayed at the bottom of the app which shows each frame of the GIF. This timeline already allows users to select one or more frames and delete them. Now, I want to add the feature to move the position of one or more frames: Users must be able to move one or more frames by dragging and dropping it/them in the timeline.

- Example: Moving the first frame after the second frame must change the order of the frames being displayed in the timeline but also when playing the GIF using the Play button
- When multiple frames are selected and moved with the mouse to a different location, all frames must be moved
  - The order of the selected frames must stay the same e.g. if you move 1 + 2 + 3 after frame 4 then 1 -> 2 (because 4 is now 1 and 1 + 1 = 2), 2 -> 3, 3 -> 4 and 4 -> 1 (because it is now the first frame)
- The exported GIF must reflect the new frame order
- You must use your tdd skill for the implementation

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
