# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Linux/Wayland title-bar merge model

Tauri 2 can support a merged toolbar/title bar on Linux/Wayland by turning off native window decorations and rendering our own draggable title bar plus minimise/maximise/close controls in the app UI. I did **not** find a supported way to keep the compositor-native caption buttons while also embedding custom web content in that same strip.

Should the plan treat this **custom client-side title bar** approach as the desired merge?

### Response
Yes — plan the merge with custom client-side controls.
