# Next steps

## Studio POC

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

## Studio V0.1

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
- [x] Improve fade-out of background grid/GIF borders
- [x] Improve key bindings again
- [x] Fix load position/alignment regression
- [x] Replace splash screen placeholders
- [x] Improve GIF loading speed
- [x] Fix bug where closing while loading breaks things
- [ ] Review refactoring opportunities

### Prompt planning

##### Review refactoring opportunities

Status: **In progress**

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

If you believe you must remove or otherwise modify an existing test to achieve your goal, you must ask for explicit confirmation via `questions.md` - list every existing tests you intend to modify, explain why, and ask if the change is acceptable.

Please check for warnings and address them following generally accepted best practice or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application.

---

Please start the next phase but read /domain-model first because I expect this skill will help you to structure any changes in a way that makes it easy for you and anyone else to work with the outcome of your changes.

---

Also, please write an E2E test for this feature.

If you believe you must remove or otherwise modify an existing test to achieve your goal, you must ask for explicit confirmation via `questions.md` - list every existing tests you intend to modify, explain why, and ask if the change is acceptable.

You must implement this using your `tdd` skill. Please check for warnings and address them in the best practice way or explicitly tell the user why you won't/shouldn't. All E2E test, all unit tests and all Rust tests must be run to verify that we have no regression. Before running E2E tests, you must build the application.

### Studio V0.2

Status: **Not started**

- [ ] Consider adding CI pipeline that creates binary
- [ ] Research how to get app into Nix packages
- [ ] Add basic text overlays
- [ ] Import frames from other GIFs
- [ ] Configure export (algorithm, colours, more...)

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
