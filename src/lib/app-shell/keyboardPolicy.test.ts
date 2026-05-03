import { describe, expect, it } from "vitest";
import { isContextualKeyboardBinding, shouldHandleTimelineKeyboardBinding } from "./keyboardPolicy";

describe("keyboardPolicy", () => {
  it("treats plain Enter and Escape as contextual bindings", () => {
    expect(
      isContextualKeyboardBinding({
        key: "Enter",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      }),
    ).toBe(true);

    expect(
      isContextualKeyboardBinding({
        key: "Escape",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      }),
    ).toBe(true);

    expect(
      isContextualKeyboardBinding({
        key: "r",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      }),
    ).toBe(false);
  });

  it("blocks timeline bindings while typing in a text field", () => {
    expect(
      shouldHandleTimelineKeyboardBinding({
        key: "ArrowLeft",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        target: { tagName: "INPUT" },
      }),
    ).toBe(false);

    expect(
      shouldHandleTimelineKeyboardBinding({
        key: "ArrowLeft",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        target: { tagName: "DIV" },
      }),
    ).toBe(true);
  });
});
