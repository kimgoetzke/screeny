# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Initial platform scope for native E2E

The codebase and product brief both point to Linux/Wayland as the must-have platform, while Tauri WebDriver also supports Windows. This answer affects the harness choice, CI shape, and whether the first milestone should optimise for one platform or two.

### Response

Linux/Wayland native Tauri first.


## Q2: Native dialog strategy

The current app opens and saves files through Tauri dialog commands. For reliable native E2E, we need to decide whether the first implementation should add a dedicated test mode that bypasses those dialogs with deterministic fixture paths, or attempt to automate the platform dialogs themselves.

### Response

Add a dedicated E2E mode that bypasses native dialogs with deterministic fixture paths for the first rollout.
