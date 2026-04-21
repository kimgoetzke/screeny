# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Acceptable L/R fade change from `circle` → `ellipse`

Switching from `radial-gradient(circle …)` to `radial-gradient(ellipse …)` keeps all gradient stops the same but changes the fade shape from circular (absolute pixel distance) to elliptical (proportional to viewport dimensions). On a 1920×1080 screen this makes the L/R fade reach transparency at ~749 px from centre instead of ~859 px — a proportionally tighter fade, but the same visual curve. The T/B fade gains the same proportional behaviour it previously lacked.

Is this change acceptable, or would you prefer a different approach (e.g., compositing separate linear-gradient masks for each axis with `mask-composite: intersect`) that preserves the absolute L/R fade distance exactly?

### Response

