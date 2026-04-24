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
- [ ] Fix bug where closing while loading breaks things
- [x] Improve fade-out of background grid/GIF borders
- [ ] Replace splash screen placeholders
- [x] Improve key bindings again
- [x] Fix load position/alignment regression
- [ ] Review refactoring opportunities

### Prompt planning

#### Improve GIF loading speed

Status: **In progress**

See `2026-04-15 gif-loading-perf`.

#### Fix bug where closing while loading breaks things

Status: **Blocked by `Improve GIF loading speed`**

#### Improve key bindings again

Status: **In progress**

Please introduce new key bindings for my application.

- `Alt` + `Left`/`Right` should move the selected frame(s) to the left/right by one frame
- `Ctrl` + `Alt` + `Left`/`Right` should move the selected frame(s) to the start/end
- `Ctrl` + `Q` should close the currently open GIF (but show the notification pop up asking for confirmation) and do nothing when no GIF is open
- `F1` should toggle the help menu

Please update `help-keybindings.ts` with the new bindings. Check that you do not break any of the existing bindings. You must add E2E test coverage.

Also, you previously introduced a regression where frames where excluded from using `Tab` to navigate to the next UI element. Can you please re-intrudoce this exclusion? To be clear: `Tab` and `Shift` + `Tab` should permit cycling through UI elements as they currently do but frames should simply be excluded. They are already navigated with other, direct key bindings.

If you believe you must remove or otherwise modify an existing test to achieve your goal, you must ask list the changes to existing tests you need to make, explain why, and ask if the change is acceptable by adding a question to the `questions.md` file as per the `planning` skill.

You must implement this using your `tdd` skill. Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application.

##### Review refactoring opportunities

Status: **Considering**

Review this repository by spawning multiple sub-agents, with each agent responsible for a specific area or review dimension. Frontend and backend must be reviewed separately.

The objective is to find junior dev mistakes, code smells, refactoring opportunities, unused or redundant dependencies, and any other issues that make the codebase harder to scale, maintain, or modify safely.

Focus on improvements that:

1.  increase scalability
2.  improve maintainability
3.  reduce the risk of regressions

Also review file size and structure. Files over 500 lines should be examined for possible decomposition into smaller, well-organised modules.

For every issue you report, include:

- the problem
- the reason it matters
- the recommended fix

Keep recommendations concrete, low-risk, and behaviour-preserving unless a behavioural change is explicitly warranted.

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
