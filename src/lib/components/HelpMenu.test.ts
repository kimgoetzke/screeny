import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import HelpMenu from "./HelpMenu.svelte";
import { helpKeyBindings } from "$lib/help-keybindings";

describe("HelpMenu", () => {
  it("renders the version, GitHub action, and key bindings table", () => {
    const { body } = render(HelpMenu, {
      props: {
        version: "0.1.0",
        keyBindings: helpKeyBindings,
        onClose: () => {},
        onOpenGitHub: () => {},
      },
    });

    expect(body).toContain('data-testid="help-version"');
    expect(body).toContain("Version 0.1.0");
    expect(body).toContain('data-testid="help-github-button"');
    expect(body).toContain('data-testid="help-keybindings-table"');
    expect(body).toContain(">Context<");
    expect(body).toContain(">Binding<");
    expect(body).toContain(">Action<");
  });

  it("renders the current key binding entries", () => {
    const { body } = render(HelpMenu, {
      props: {
        version: "0.1.0",
        keyBindings: helpKeyBindings,
        onClose: () => {},
        onOpenGitHub: () => {},
      },
    });

    expect(body).toContain("Ctrl+I");
    expect(body).toContain("Toggle inspector minimised state");
    expect(body).toContain("Ctrl+R");
    expect(body).toContain("Reset zoom");
    expect(body).toContain("Ctrl+Shift+ArrowRight");
    expect(body).toContain("Extend selection to last frame");
    expect(body).toContain("Escape");
    expect(body).toContain("Cancel or dismiss the dialog");
  });
});
