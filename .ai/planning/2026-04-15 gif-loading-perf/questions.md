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

Let's first complete phase 6. Then we will reevaluate.

<!-- Processed: Phase 7 explicitly deferred until after Phase 6 completes. plan.md updated. -->

## Q4: Does async Rust command materially reduce the OS freeze prompt?

Phase 5 plans to make `decode_gif_stream` async and use `spawn_blocking`. On Linux/Wayland/Hyprland, does this change the behaviour of the "terminate or wait" compositor prompt, or is the compositor reacting to the webview JS thread being blocked (which the Rust async change wouldn't fix)?

### Response

I don't know. Can you please do the necessary research find the answer for this?

<!-- Processed: Researched. See findings.md "Wayland ANR Mechanism". Short answer: making decode_gif_stream async does NOT fix the OS freeze dialog. The dialog is triggered by the GTK main thread (not JS, not Rust threads). Phase 5 async change is still good practice but will not address the ANR symptom. Phase 5/6 notes updated in plan.md. -->

## Q5: UX priority for remaining fixes

Given the remaining freeze symptoms, which matters most for the next fix iteration?

- (a) Immediate loading feedback — progress bar visible right away, even if total load time is unchanged
- (b) Responsiveness during load — app not frozen/unresponsive while loading
- (c) Total wall-clock load time — GIF loads faster end-to-end

The answer determines whether Phase 5 alone is sufficient or whether Phase 6 or 7 is the priority.

### Response

Most important right now is that the app doesn't appear frozen to the system and that there is _some_ form of UI feedback to the user that it is indeed loading the GIF. This must be done immedately. Then, we want to focus on faster E2E loading and, if we haven't fixed it by this time already, making sure that the progress bar appears right away and is somewhat accurate throughout the journey (wrong: progress bar appears immediately, stays at 0% for 20s, then goes to 100% in <100ms).

<!-- Processed: Priorities recorded in plan.md. Progress bar accuracy concern raises Q6 — current byte-based approach tracks file I/O, not PNG encode work, which would produce the "wrong" pattern described. Phase 5 plan updated to address progress bar approach. -->

## Q6: Progress bar accuracy — frame-count vs byte-based

The current byte-based progress (ProgressReader) tracks file I/O speed, which is fast. The expensive phase is PNG+base64 encoding per frame, which happens after the bytes are read. This means the progress bar will complete quickly (tracking fast file reads) and then show no progress while the slow encode work happens — the "wrong" pattern from Q5.

Options:

1. **Frame-count progress**: emit a progress event after each frame is encoded (`frames_encoded / total_frames`). Requires knowing the total upfront — needs a cheap pre-scan of the GIF to count frames (sequentially scan for frame header bytes; ~1–2ms for a typical file).
2. **Keep byte-based, remove the percentage**: show a spinner + "Loading frame N…" counter instead of a percentage bar, since bytes don't represent encode progress. The counter is always accurate.
3. **Hybrid**: byte-based percentage during file read (fast, gives early feedback), switching to frame-count display once streaming begins.

Option 1 gives a percentage that reflects actual encode progress. Option 2 is simplest and always honest. Option 3 is most complex but most informative.

### Response

Option 3 please.

<!-- Processed: Hybrid approach adopted. New `Start { total_bytes, total_frames }` event added to DecodeEvent; GIF pre-scan for frame count; byte % during read, "frame X of Y" once streaming begins. Phase 5 tasks and decisions table updated in plan.md. -->
