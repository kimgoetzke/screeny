# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Old decode commands — keep or remove?

The current `decode_gif` and `decode_gif_bytes` Tauri commands will be superseded by the new streaming command. E2E tests (`e2e.rs`) use `e2e_open_fixture` which likely calls one of these. Should I keep the old commands for backwards compatibility, or update E2E tests too?

### Response

We still need E2E coverage. But E2E tests should test the real code, not some code that is only written for tests. Pleases investigate and propose E2E tests that test the real code, follow the same test-intention, and add value. We don't want lower test coverage after this change.

<!-- Processed -->

## Q2: Progress bar granularity

The plan uses byte-level progress tracking via a ProgressReader wrapper. An alternative is frame-count progress (simpler but requires a pre-scan pass, or shows only "X frames loaded" without a percentage). The byte approach gives a smooth percentage bar. Is percentage progress acceptable, or do you prefer frame-count-based?

### Response

Let me tell you my priorities:
1st priority: Performance
2nd priority: Clarity (showing clear progress towards the goal)

It sounds like your non-byte-level approach would be faster but wouldn't give us as much clarity. So the question how much performance do we gain for the sacrifice in clarity? If it's twice as fast or more, then the sacrifice is acceptable. Otherwise I'd start with the byte-level approach.

<!-- Processed -->

## Q3: Where is the real-world bottleneck?

Post-implementation validation showed the app still freezes. The remaining cost is split between Rust-side (full-frame PNG+base64 encode per frame) and frontend-side (array copying, timeline rerender, viewer redraws). Without profiling on real GIF files, the split is unknown. Is it worth profiling before committing to Phase 7 (payload redesign), or should we proceed with Phases 5 and 6 first and measure the impact?

### Response

## Q4: Does async Rust command materially reduce the OS freeze prompt?

Phase 5 plans to make `decode_gif_stream` async and use `spawn_blocking`. On Linux/Wayland/Hyprland, does this change the behaviour of the "terminate or wait" compositor prompt, or is the compositor reacting to the webview JS thread being blocked (which the Rust async change wouldn't fix)?

### Response

## Q5: UX priority for remaining fixes

Given the remaining freeze symptoms, which matters most for the next fix iteration?

- (a) Immediate loading feedback — progress bar visible right away, even if total load time is unchanged
- (b) Responsiveness during load — app not frozen/unresponsive while loading
- (c) Total wall-clock load time — GIF loads faster end-to-end

The answer determines whether Phase 5 alone is sufficient or whether Phase 6 or 7 is the priority.

### Response
