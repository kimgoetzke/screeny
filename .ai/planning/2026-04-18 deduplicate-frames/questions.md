# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Duration handling during deduplication

When two adjacent frames are visually identical and the later one is removed, should the removed frame's duration be added to the kept frame so playback timing is preserved, or should the later frame simply disappear with no duration merge? This affects store behaviour, unit-test expectations, and the E2E assertion strategy.

### Response

Great idea. Let's please have 2 buttons then: One for the merging deduplication and one for the dropping deduplication.
