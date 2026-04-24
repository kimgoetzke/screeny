import { describe, expect, it } from "vitest";
import { helpKeyBindings } from "./help-keybindings";

describe("helpKeyBindings", () => {
  it("documents the new keyboard shortcuts", () => {
    expect(helpKeyBindings).toEqual(
      expect.arrayContaining([
        { context: "Global", binding: "Ctrl+Q", action: "Close current GIF" },
        { context: "Global", binding: "F1", action: "Toggle help menu" },
        { context: "Timeline", binding: "Alt+ArrowLeft", action: "Move selected frame(s) left" },
        { context: "Timeline", binding: "Alt+ArrowRight", action: "Move selected frame(s) right" },
        {
          context: "Timeline",
          binding: "Ctrl+Alt+ArrowLeft",
          action: "Move selected frame(s) to start",
        },
        {
          context: "Timeline",
          binding: "Ctrl+Alt+ArrowRight",
          action: "Move selected frame(s) to end",
        },
      ]),
    );
  });
});
