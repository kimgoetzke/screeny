import { describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import WindowControls from "./WindowControls.svelte";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: vi.fn(() => Promise.resolve()),
    toggleMaximize: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  })),
}));

describe("WindowControls", () => {
  it("renders minimise, maximise, and close window buttons", () => {
    const { body } = render(WindowControls);
    expect(body).toContain('data-testid="btn-window-minimise"');
    expect(body).toContain('data-testid="btn-window-maximise"');
    expect(body).toContain('data-testid="btn-window-close"');
  });
});
