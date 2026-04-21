export interface HelpKeyBinding {
  context: string;
  binding: string;
  action: string;
}

export const helpKeyBindings: HelpKeyBinding[] = [
  { context: "Global", binding: "Space", action: "Toggle playback" },
  { context: "Global", binding: "Enter", action: "Confirm/select" },
  { context: "Global", binding: "Escape", action: "Cancel" },
  { context: "Canvas", binding: "MouseWheel", action: "Zoom in/out" },
  { context: "Canvas", binding: "Ctrl+I", action: "Toggle inspector minimised state" },
  { context: "Canvas", binding: "Ctrl+R", action: "Reset zoom" },
  { context: "Timeline", binding: "Ctrl+A", action: "Select all frames" },
  { context: "Timeline", binding: "ArrowLeft", action: "Select previous frame" },
  { context: "Timeline", binding: "ArrowRight", action: "Select next frame" },
  { context: "Timeline", binding: "Shift+ArrowLeft", action: "Extend selection left" },
  { context: "Timeline", binding: "Shift+ArrowRight", action: "Extend selection right" },
  { context: "Timeline", binding: "Ctrl+ArrowLeft", action: "Select first frame" },
  { context: "Timeline", binding: "Ctrl+ArrowRight", action: "Select last frame" },
  {
    context: "Timeline",
    binding: "Ctrl+Shift+ArrowLeft",
    action: "Extend selection to first frame",
  },
  {
    context: "Timeline",
    binding: "Ctrl+Shift+ArrowRight",
    action: "Extend selection to last frame",
  },
  { context: "Timeline", binding: "Delete", action: "Delete selected frame(s)" },
  { context: "Timeline", binding: "Ctrl+D", action: "Delete selected frame(s)" },
  { context: "Timeline", binding: "PageUp", action: "Scroll timeline left" },
  { context: "Timeline", binding: "PageDown", action: "Scroll timeline right" },
  { context: "Timeline", binding: "MouseWheel", action: "Scroll timeline" },
  {
    context: "Inspector",
    binding: "Shift+MouseWheel",
    action: "Increment/decrement numerical field by 100",
  },
];
