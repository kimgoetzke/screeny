# Next steps

- [x] Create full-stack E2E tests
  - Render real components, click real buttons
  - Tests the full UI pipeline: Open click → frames in store → timeline renders → delete/reorder → Export click
  - Add a test mode to the dialog commands (env var or feature flag) that returns a predetermined path instead of showing a dialog
  - Run the actual Tauri app in test mode with a test GIF
  - Rust integration tests already verify decode/encode with real files
  - The two layers together cover the complete flow
- [ ] Fix: `Failed to open file dialog: Failed to send open dialog request: A portal frontend implementing `org.freedesktop.portal.FileChooser` was not found`
- [ ] Allow drag-and-drop GIF into main section to open GIF
- [ ] Improve styling


V2

### Problem: Speed of loading GIFs, app appears hanging during loading process

- Even small GIFs of < 1MB take about a minute to load and there is no indication that the app hasn't crashed yet
- To make things worse, after a few sections, there will be a system pop up suggesting that the app has crashed and asking the user to select if they want to "Terminate" it or "Wait"

Goal:
- Even when loading a GIF takes a long time, the system must not think that the app has crashed
- During the loading process of a GIF, there must be visual indication indicating that the GIF is being loaded
- It is STRONGLY desirable, if possible, to show some form of progress (e.g. a percentage number alongside the loading spinner or simply just a progress bar below a "Loading..." text)
- Loading a GIF must be at a minimum one order of magnitude faster
  - Loading a GIF should be very fast
  - A 1MB GIF should be loaded near instantly


### Improvement to tool bar

- We need a generic, re-usable notification pop-up
  - It must be capable of displaying:
    - A short notification message/question over multiple lines
    - Either two buttons like "Cancel" or "Continue" or "Yes" and "No"
    - Or one button such as "OK"
  - The notification text, the number of buttons (1 vs 2) and the buttons text must be customisable
- While a GIF is currently "opened", the "Open" button should not disappear and instead there should be a button to "Close" the current project instead
   - When clicking "Close", the re-usable notification pop-up must be displayed with a message telling the user that any unsaved changes will be lost if they continue and they can "Cancel" or "Continue"
- While a GIF is currently "opened", we need a play and stop button which should be icons
   - When play is clicked the, the GIF is played in the main section while the currently active frame in the timeline is continuously updated
   - While the GIF is playing, the play button is visible but disabled - it cannot be clicked and has the visual language (e.g. colouring) to support it
   - While the GIF is playing, the stop button is interactible; when pressed, the GIF stops playing and the main section/timeline stay at the currently active frame (instead of reverting to frame 1 for example)
   - While the GIF is NOT playing, the stop button is visible but disabled - it cannot be clicked and has the visual language (e.g. colouring) to support it

### Improvements to timeline

- When a user hovers over a frame, a button to delete the frame is visible which is correct. What is missing though is that when the user hovers over this (x) button, there's no on-mouse-over effect. Please add one in-line with the colour theme.
- It must be possible to Shift + Left mouse click a frame in the time line to select _all_ frames from (and including) the currently selected frame up until (and including) the clicked frame
  - The delete button that's visible on hover must then be shown on all visible frames that are selected whenever the user hovers over just one
  - When the user hovers over a button the same on-mouse-over effect applies to buttons on all selected & visible frames, indicating that the action will be applied to all frames
- Users must be able to move a frame by dragging and dropping it in the timeline
  - Moving the first frame after the second frame must change the order of the frames being displayed
