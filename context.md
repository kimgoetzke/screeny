# Screeny — Bounded Context

## Glossary

### Project

The unit of work the user edits and exports. A Project is a sequence of Frames that begins when the user opens a GIF (or records a screen capture) and ends when the user exports or closes it.

Currently a Project exists only in memory for its lifetime; there is no persistent project file format yet. The term anticipates a future save/load format where edit state is persisted to disk.

A Project is always in exactly one lifecycle state at a time (see **Project State**).

### Frame

A single still image within a Project. Has an identity (`id`), pixel data (`imageData`), display duration in milliseconds, and dimensions. The ordered sequence of Frames is the Project's content.

`ExportFrame` (the id-stripped IPC transfer object) is an implementation detail of the Rust boundary, not a domain term.

### Open

The action of loading a GIF file from disk into a Project. Replaces any current Project content. Transitions the Project from Empty (or Active) → Loading → Active.

### Export

The action of encoding the current Project's Frames to a GIF file on disk. Does not modify the Project. Transitions the Project through Exporting and back to Active.

### Import

The action of adding frames from a GIF or static image into the current Active Project. Imported frames are inserted after the current Selection, centred into the current Project dimensions, and keep the existing Project bounds as the export/crop boundary. Transitions the Project through Importing and back to Active.

### Playback

The animated preview of a Project that cycles through its Frames at their declared durations. Controlled by Play and Stop. Only available when the Project is Active.

### Canvas

The main preview surface for the current Project, including zoom, pan, and inspector-aware framing.

### Keyboard Binding

A documented keyboard command that is app-wide by default; text-editing controls keep native key behaviour, while generic confirmation and cancellation keys such as Enter and Escape may be contextual.

### Project Lifecycle

The orchestration layer that wires together the DialogProvider, GifBackend, frameStore, and rendering synchronisation to execute the Open, Close, Cancel, and Export actions. Lives in `src/lib/project-lifecycle/projectLifecycle.svelte.ts`, separate from the Toolbar component so it can be tested independently.

### Window Controls

The OS-level window management buttons (Minimise, Maximise, Close window). Distinct from Project-level controls — they operate on the application window directly and have no relationship to Project state.

### Cancel

The action of aborting an in-progress Open or Import. Cancelling Open returns the Project to the Empty state without loading any frames. Cancelling Import preserves the Active Project and discards buffered imported frames. Only available while the Project is in the Loading or Importing state.

### Close

The action of discarding the current Project and returning to the Empty state. Requires user confirmation when the Project is Active, because any unsaved edits are permanently lost.

### Frame Editing

The set of operations that mutate the ordered sequence of Frames in a Project: deleting, duplicating, reordering, moving, deduplicating, and setting duration. Frame Editing operations are pure — they take the current frame list and selection as inputs and return a new frame list.

### Selection

The user's current focus within the Timeline. Consists of an **anchor** frame (the primary selected frame, set by a direct click or navigation), an **active end** (the frame at the moving end of a keyboard range extension), and the **selected set** (all frames between anchor and active end, inclusive). Single-frame focus is the degenerate case where anchor, active end, and selected set all point to the same frame.

### Project State

The five lifecycle states a Project moves through:

- **Empty** — no frames loaded; the user sees an Open button and nothing else to act on.
- **Loading** — frames are streaming in from the Rust decoder for Open; the user sees progress feedback and a Cancel control.
- **Active** — one or more frames are loaded and ready to edit; the full editing surface is available.
- **Importing** — frames are decoding into a buffer for Import; the Active Project remains visible and unchanged until Import commits, and the user sees progress feedback and a Cancel control.
- **Exporting** — frames are being encoded and written to disk by the Rust encoder; controls are temporarily locked.

## Flagged ambiguities

- "drag-drop import" was used as if active drag-and-drop should mutate the current Project — resolved for now: drag-and-drop opens a GIF only while Empty; while Active it is blocked with a notification telling the user to close the current image or use Import.
- "viewer" / "canvas" were used interchangeably for the main preview surface — resolved: **Canvas** is the domain term, and the code now uses that term consistently.
