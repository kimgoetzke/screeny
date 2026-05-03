# Questions & Answers

<!--
  WHAT: A record of important questions to answer that will change the implementation approach. Add 
    questions to the user here but the user may also add questions for you once you've created the file.
  WHY: A persistent record for discussion between you and the user.

 Add the sentence below as a reminder to the user and yourself.
-->

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Scope and ownership of the deepened Project Lifecycle seam

Should the deepened **Project Lifecycle** module own all **Project State** transitions for **Open** (dialog + drag-drop), **Cancel**, **Close**, and **Export**? Should lifecycle-facing state live behind that seam? Should **Canvas** fitting stay outside the seam as a callback? Should `frameStore` be hidden from lifecycle callers? Should current silent cancellation/superseded-open behavior be preserved?

### Response

1 yes, 2 yes, 3 outside, 4 hide frameStore, 5 keep current behaviour

## Q2: Close confirmation, state shape, and drag-drop error channel

Should **Close** confirmation live inside the lifecycle **Interface** or stay as UI-local state? Should the seam expose an explicit **Project State** model or just booleans/strings? Should drag-drop errors use the same lifecycle status channel or remain local to `+page.svelte`?

### Response

- Close confirmation: B
- State shape: B
- Drag-drop error channel: B

## Q3: Depth of frameStore hiding, open-from-path result semantics, and treatment of projectOpen.ts

Should the refactor hide `frameStore` only from lifecycle callers or from the whole UI? Should `openFromPath(path)` return an outcome to the caller so local drag-drop errors can stay local? Should `projectOpen.ts` be folded into the lifecycle implementation? Should `requestClose` be meaningful only in **Active** rather than acting like **Cancel** in **Loading**?

### Response

1 A, 2 A, 3 A, 4 A

## Q4: Reactive form, instance lifetime, and drag-drop lifecycle status behavior

Should the deepened module be rune-backed (`projectLifecycle.svelte.ts`) rather than plain stores? Should `+page.svelte` create a lifecycle instance and pass it down rather than using a singleton? For drag-drop **Open**, should the lifecycle toolbar status remain unchanged and the outcome be returned to the caller?

### Response

1 A, 2 A, 3 A

## Q5: Raw fields versus derived lifecycle view data

Should the lifecycle seam expose raw `statusMessage` / `progress` fragments, or derived lifecycle view data that callers can render directly?

### Response

B

## Q6: Dialog adapter placement, Canvas callback configuration, and dialog rendering location

Should dialog adapter ownership move to `+page.svelte`? Should the `onFirstFrame` **Canvas** callback be configured once when creating the lifecycle module? Should lifecycle dialogs (file picker, save input, close confirm) render in `+page.svelte` rather than `Toolbar.svelte`?

### Response

1 B, 2 B, 3 B
