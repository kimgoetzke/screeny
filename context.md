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

### Playback

The animated preview of a Project that cycles through its Frames at their declared durations. Controlled by Play and Stop. Only available when the Project is Active.

### Project Lifecycle

The orchestration layer that wires together the DialogProvider, GifBackend, frameStore, and rendering synchronisation to execute the Open, Close, Cancel, and Export actions. Lives in `src/lib/projectLifecycle.ts`, separate from the Toolbar component so it can be tested independently.

### Window Controls

The OS-level window management buttons (Minimise, Maximise, Close window). Distinct from Project-level controls — they operate on the application window directly and have no relationship to Project state.

### Cancel

The action of aborting an in-progress Open. Returns the Project to the Empty state without loading any frames. Only available while the Project is in the Loading state.

### Close

The action of discarding the current Project and returning to the Empty state. Requires user confirmation when the Project is Active, because any unsaved edits are permanently lost.

### Frame Editing

The set of operations that mutate the ordered sequence of Frames in a Project: deleting, duplicating, reordering, moving, deduplicating, and setting duration. Frame Editing operations are pure — they take the current frame list and selection as inputs and return a new frame list.

### Selection

The user's current focus within the Timeline. Consists of an **anchor** frame (the primary selected frame, set by a direct click or navigation), an **active end** (the frame at the moving end of a keyboard range extension), and the **selected set** (all frames between anchor and active end, inclusive). Single-frame focus is the degenerate case where anchor, active end, and selected set all point to the same frame.

### Project State

The four lifecycle states a Project moves through:

- **Empty** — no frames loaded; the user sees an Open button and nothing else to act on.
- **Loading** — frames are streaming in from the Rust decoder; the user sees progress feedback and a Cancel control.
- **Active** — one or more frames are loaded and ready to edit; the full editing surface is available.
- **Exporting** — frames are being encoded and written to disk by the Rust encoder; controls are temporarily locked.
