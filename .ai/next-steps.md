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
- [x] Fix hanging right after GIF is selected/dropped and before it loads
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
- [x] Improve toolbar
- [x] Add background grid
- [x] Fix "Loading 0%" visible as soon as you click "Open"
- [x] Hide inspector until GIF loaded
- [x] Add inspector buttons to move frame(s)
- [x] Add select-to-first/last key binding
- [x] Load GIF to fill visible canvas
- [ ] Improve GIF loading speed
- [ ] Review refactoring opportunities
- [ ] Fix bug where closing while loading breaks things
- [ ] Improve fade-out of background grid/GIF borders
- [ ] Replace splash screen placeholders

### Prompt planning

#### Improve GIF loading speed

Status: **In progress**

See `2026-04-15 gif-loading-perf`.

##### Review refactoring opportunities

Status: **Considering**

I want you to review the code in this repository by spawning off a number of sub-agents, each reviewing specific dimensions and sections of this code base. For example, frontend and backend code must be reviewed separately.

The goal of this review is to identify "junior dev mistakes", code smells, other refactoring opportunities, unused/redundant dependencies and other opportunities to make this code base 1) more scalable, 2) easier to maintain, 3) without any regression.

Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application.

#### Fix bug where closing while loading breaks things

Status: **Blocked by `Improve GIF loading speed`**

#### Improve fade-out of background grid/GIF borders

Status: **Ready**

This application shows a background grid in the main canvas which is centered on application start up. When a GIF is loaded, the GIF is also centered and displayed above the grid. It is displayed with a thin border on all sides that extend in each direction beyond the GIF itself.

I would like to improve the fade-out of both the background grid and the border around the GIF.

Currently, the border simply extends for a very long time, making it less likely for a user to scroll far enough to see the end. However, it does not fade out.
The background grid does fade out to the left and right which is perfect and it must not change. However, it does not fade out to the top and bottom and simply stops at some point, same as the border.

I would like to change this: Both grid and border should fade out in the same way and over the same distance in all directions. As for the distance for the fade, the current fade to the left and right of the grid is perfect. Also, just to be clear: The fade out must result in the border and grid fading out in a way that only the background colour is visible once faded, so they must fade into the background colour or 100% transparency (ideally the latter, but this is up to you).

Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application.

---

Also, please write an E2E test for this feature.

You must implement this using your `tdd` skill. Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application.

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
