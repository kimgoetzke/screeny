import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import Toolbar from "./Toolbar.svelte";
import toolbarSource from "./Toolbar.svelte?raw";
import { frameStore } from "$lib/stores/frames.svelte";
import type { Frame } from "$lib/types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve(false)),
}));

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn(() => Promise.resolve("0.1.0")),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: vi.fn(() => Promise.resolve()),
    toggleMaximize: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn(() => Promise.resolve()),
}));

function makeFrame(id: string, duration = 100): Frame {
  return { id, imageData: `data:image/png;base64,${id}`, duration, width: 10, height: 10 };
}

type LifecycleStub = {
  projectState: "Empty" | "Loading" | "Active" | "Exporting";
  hasProject: boolean;
  closeRequested: boolean;
  toolbarFeedback:
    | { kind: "none" }
    | { kind: "loading"; label: string; percent: number }
    | { kind: "status"; message: string };
  aspectRatioWarning: string | null;
  canOpen: boolean;
  canCancel: boolean;
  canClose: boolean;
  canExport: boolean;
  canImport: boolean;
  open: () => Promise<void>;
  openFromPath: (path: string) => Promise<{ message?: string; error?: string }>;
  cancel: () => Promise<void>;
  requestClose: () => void;
  confirmClose: () => void;
  dismissClose: () => void;
  dismissAspectRatioWarning: () => void;
  importFrames: () => Promise<void>;
  export: () => Promise<void>;
};

function makeLifecycle(overrides: Partial<LifecycleStub> = {}): LifecycleStub {
  return {
    projectState: "Empty",
    hasProject: false,
    closeRequested: false,
    toolbarFeedback: { kind: "none" },
    aspectRatioWarning: null,
    canOpen: true,
    canCancel: false,
    canClose: false,
    canExport: false,
    canImport: false,
    open: vi.fn(async () => {}),
    openFromPath: vi.fn(async () => ({})),
    cancel: vi.fn(async () => {}),
    requestClose: vi.fn(),
    confirmClose: vi.fn(),
    dismissClose: vi.fn(),
    dismissAspectRatioWarning: vi.fn(),
    importFrames: vi.fn(async () => {}),
    export: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("Toolbar", () => {
  beforeEach(() => {
    frameStore.clear();
  });

  function renderToolbar(lifecycle = makeLifecycle()) {
    return render(Toolbar, { props: { lifecycle } });
  }

  describe("Open / Close / Cancel button visibility", () => {
    it("shows Open button when the Project is Empty", () => {
      const { body } = renderToolbar(makeLifecycle());
      expect(body).toContain('data-testid="btn-open"');
    });

    it("does not show Close button when the Project is Empty", () => {
      const { body } = renderToolbar(makeLifecycle());
      expect(body).not.toContain('data-testid="btn-close"');
    });

    it("shows Close button when a Project is loaded", () => {
      const { body } = renderToolbar(
        makeLifecycle({ projectState: "Active", hasProject: true, canClose: true, canExport: true }),
      );
      expect(body).toContain('data-testid="btn-close"');
    });

    it("shows Cancel button while the Project is Loading", () => {
      const { body } = renderToolbar(
        makeLifecycle({
          projectState: "Loading",
          canOpen: false,
          canCancel: true,
          toolbarFeedback: { kind: "loading", label: "Loading...", percent: 0 },
        }),
      );
      expect(body).toContain('data-testid="btn-cancel"');
      expect(body).not.toContain('data-testid="btn-open"');
    });
  });

  it("shows Import immediately left of Export only when a Project is Active", () => {
    const active = renderToolbar(
      makeLifecycle({
        projectState: "Active",
        hasProject: true,
        canClose: true,
        canImport: true,
        canExport: true,
      }),
    ).body;
    const empty = renderToolbar(makeLifecycle()).body;
    const loading = renderToolbar(
      makeLifecycle({
        projectState: "Loading",
        canCancel: true,
        toolbarFeedback: { kind: "loading", label: "Loading...", percent: 0 },
      }),
    ).body;

    expect(active).toMatch(/data-testid="btn-import"[\s\S]*data-testid="btn-export"/);
    expect(empty).not.toContain('data-testid="btn-import"');
    expect(loading).not.toContain('data-testid="btn-import"');
  });

  it("play and stop buttons are not shown when there are no frames", () => {
    const { body } = renderToolbar(makeLifecycle());
    expect(body).not.toContain('data-testid="btn-play"');
    expect(body).not.toContain('data-testid="btn-stop"');
  });

  it("play and stop buttons are shown when frames are loaded", () => {
    frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
    const { body } = renderToolbar(
      makeLifecycle({ projectState: "Active", hasProject: true, canClose: true, canExport: true }),
    );
    expect(body).toContain('data-testid="btn-play"');
    expect(body).toContain('data-testid="btn-stop"');
  });

  it("renders loaded-state playback controls in a dedicated centred toolbar region", () => {
    frameStore.setFrames([makeFrame("a"), makeFrame("b")]);

    const { body } = renderToolbar(
      makeLifecycle({ projectState: "Active", hasProject: true, canClose: true, canExport: true }),
    );

    expect(body).toMatch(
      /<div class="[^"]*toolbar-playback[^"]*">[\s\S]*data-testid="btn-play"[\s\S]*data-testid="btn-stop"[\s\S]*<\/div>/,
    );
  });

  it("renders lifecycle-derived loading feedback between Export and the drag region", () => {
    const { body } = renderToolbar(
      makeLifecycle({
        projectState: "Loading",
        canCancel: true,
        toolbarFeedback: { kind: "loading", label: "Loading frame 1 of 3", percent: 33 },
      }),
    );

    expect(body).toContain('data-testid="loading-progress"');
    expect(body).toContain("Loading frame 1 of 3");
    expect(body).toContain("width: 33%\"");
  });

  it("renders lifecycle-derived status messages in the left toolbar cluster", () => {
    const { body } = renderToolbar(
      makeLifecycle({
        projectState: "Active",
        hasProject: true,
        canClose: true,
        canExport: true,
        toolbarFeedback: { kind: "status", message: "Exported successfully" },
      }),
    );

    expect(body).toContain('data-testid="status-message"');
    expect(body).toContain("Exported successfully");
  });

  it("renders the help trigger and custom window controls in the title bar area", () => {
    const { body } = renderToolbar(makeLifecycle());

    expect(body).toContain('data-testid="btn-help"');
    expect(body).toContain('data-testid="btn-window-minimise"');
    expect(body).toContain('data-testid="btn-window-maximise"');
    expect(body).toContain('data-testid="btn-window-close"');
  });

  describe("keyboard shortcuts", () => {
    it("registers a window-level keydown listener for toolbar shortcuts", () => {
      expect(toolbarSource).toContain("keydown");
      expect(toolbarSource).toMatch(/window\.addEventListener\s*\(\s*["']keydown["']/);
    });

    it("handles F1 by toggling the help menu", () => {
      expect(toolbarSource).toMatch(/key\s*===\s*["']F1["']/);
      expect(toolbarSource).toMatch(/showHelpMenu\s*=\s*!\s*showHelpMenu/);
      expect(toolbarSource).toMatch(/F1[\s\S]{0,120}preventDefault/);
    });

    it("handles Ctrl+Q by calling lifecycle.requestClose() only when closing is allowed", () => {
      expect(toolbarSource).toMatch(/key\s*===\s*["']q["']|key\s*===\s*["']Q["']/);
      expect(toolbarSource).toContain("lifecycle.requestClose()");
      expect(toolbarSource).toContain("lifecycle.canClose");
    });
  });

  it("no longer owns file-picker or close-confirm dialog rendering", () => {
    expect(toolbarSource).not.toContain("FilePicker");
    expect(toolbarSource).not.toContain("NotificationDialog");
    expect(toolbarSource).not.toContain("showSaveInput");
  });

  describe("disabled states", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("close stays visible but disabled while Exporting", () => {
      const { body } = renderToolbar(
        makeLifecycle({ projectState: "Exporting", hasProject: true, canClose: false, canExport: false }),
      );
      const closeBtnTag = body.match(/<button[^>]*data-testid="btn-close"[^>]*>/)?.[0] ?? "";
      expect(closeBtnTag).toContain("disabled");
    });

    it("export button is disabled when lifecycle.canExport is false", () => {
      const { body } = renderToolbar(makeLifecycle());
      const exportBtnTag = body.match(/<button[^>]*data-testid="btn-export"[^>]*>/)?.[0] ?? "";
      expect(exportBtnTag).toContain("disabled");
    });

    it("play button is disabled when playing", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      const { body } = renderToolbar(
        makeLifecycle({ projectState: "Active", hasProject: true, canClose: true, canExport: true }),
      );
      const playBtnTag = body.match(/<button[^>]*data-testid="btn-play"[^>]*>/)?.[0] ?? "";
      expect(playBtnTag).toContain("disabled");
    });

    it("stop button is not disabled when playing", () => {
      frameStore.setFrames([makeFrame("a"), makeFrame("b")]);
      frameStore.play();
      const { body } = renderToolbar(
        makeLifecycle({ projectState: "Active", hasProject: true, canClose: true, canExport: true }),
      );
      const stopBtnTag = body.match(/<button[^>]*data-testid="btn-stop"[^>]*>/)?.[0] ?? "";
      expect(stopBtnTag).not.toContain("disabled");
    });
  });
});
