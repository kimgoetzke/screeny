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
