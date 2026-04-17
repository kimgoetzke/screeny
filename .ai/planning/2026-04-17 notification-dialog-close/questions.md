# Questions & Answers

Questions are added in chronological order to this file; new questions are added at the bottom.

## Q1: Dismiss on backdrop click or Escape key?

Should the `NotificationDialog` be dismissible by clicking the backdrop or pressing Escape?

In the Close confirmation flow, dismissing via Escape/backdrop would behave the same as "Cancel" (no action taken). This could be convenient but may conflict with other future usages where dismissal without a choice is undesirable (e.g. a 1-button "OK" dialog that must be acknowledged).

Proposed default: yes for 2-button mode (treat as cancel), no for 1-button mode (must press OK). Does this match your expectations?

### Response

Yes, that's a great suggestions, I agree.
<!-- Processed -->
