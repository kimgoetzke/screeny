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
- [x] Add background grid
- [ ] Fix "Loading 0%" visible as soon as you click "Open"
- [x] Hide inspector until GIF loaded
- [x] Add inspector buttons to move frame(s)
- [x] Add select-to-first/last key binding
- [ ] Review refactoring opportunities

### Prompt planning

#### Fix "Loading 0%" visible as soon as you click "Open"

Status: **In progress**

Please plan a bug fix. Currently, when you click the "Open" button. The tool bar immediately shows a "Loading 0%" despite no GIF having been selected. Can you please update this to only show from the moment, a file has been selected for opening?

In addition, when the drag-and-drop feature is used to open a GIF, the equivalent message is not displayed. Please plan the work to display the "Loading 0%" UI hint immediately when a GIF has been dropped to indicate to the user that it is being processed.

#### Improve toolbar

Status: **In progress**

Please plan improvements to the toolbar. 

First, can you investigate if it's possible to merge the header bar that contains the minimise/maximise/close buttons of the app with the tool bar?
- Please do web research to find understand what's possible.
- If no, then there's no work to be done here.
- If yes, please plan out doing this.

Second, we need a help menu. This menu should be accessible via a button that is located at the top right of the tool bar and should have a question mark icon.
- If you are able to merge the header bar with the tool bar then the minimise/maximise/close buttons most always remain at the far right and this new button would be to the left of them
- When clicking the button, an overlay menu should open
- The menu should show the current version of the application
- There should be one button that is the GitHub icon; there should be text explaining that the user can get help or raise issue there; clicking it should open https://github.com/kimgoetzke/screeny
- Another section should be a table that lists the key bindings
  - The table shows a list of key bindings in a table with the columns Context (e.g. Global, Inspector, Timeline), Binding, and Action
  - For this you'll need to identify all key bindings we have configured so far and list them here please

Second, can you please position the payback icons always horizontally centered in the tool bar.

You must implement this using your `tdd` skill. Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression.

#### Improve the background grid

Status: **Considering**

- Make it less visible?
- Make the fade based on the grid, not the application canvas edges?
- Add cross hair of a slightly brighter colour that centers behind the center of the GIF so that it's always easy to find it

##### Review refactoring opportunities

Status: **Considering**

I want you to review the code in this repository by spawning off a number of sub-agents, each reviewing specific dimensions and sections of this code base. For example, frontend and backend code must be reviewed separately.

The goal of this review is to identify "junior dev mistakes", refactoring opportunities, unused/redundant dependencies and other opportunities to make this code base 1) more scalable, 2) easier to maintain, 3) without any regression.

Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application with 

---

Also, please write an E2E test for this feature.

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
