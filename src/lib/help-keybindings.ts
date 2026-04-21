export interface HelpKeyBinding {
  context: string;
  binding: string;
  action: string;
}

export const helpKeyBindings: HelpKeyBinding[] = [
  { context: "Global", binding: "Ctrl+I", action: "Toggle inspector minimised state" },
  { context: "Timeline", binding: "Ctrl+A", action: "Select all frames" },
  { context: "Timeline", binding: "ArrowLeft", action: "Select previous frame" },
  { context: "Timeline", binding: "ArrowRight", action: "Select next frame" },
  { context: "Timeline", binding: "Shift+ArrowLeft", action: "Extend selection left" },
  { context: "Timeline", binding: "Shift+ArrowRight", action: "Extend selection right" },
  { context: "Timeline", binding: "Ctrl+ArrowLeft", action: "Select first frame" },
  { context: "Timeline", binding: "Ctrl+ArrowRight", action: "Select last frame" },
  { context: "Timeline", binding: "Ctrl+Shift+ArrowLeft", action: "Extend selection to first frame" },
  { context: "Timeline", binding: "Ctrl+Shift+ArrowRight", action: "Extend selection to last frame" },
  { context: "Timeline", binding: "Delete", action: "Delete selected frame(s)" },
  { context: "Timeline", binding: "Space", action: "Toggle playback" },
  { context: "Timeline", binding: "PageUp", action: "Scroll timeline left" },
  { context: "Timeline", binding: "PageDown", action: "Scroll timeline right" },
  { context: "Timeline", binding: "Enter", action: "Select the focused frame thumbnail" },
  { context: "Save dialog", binding: "Enter", action: "Confirm save path" },
  { context: "Save dialog", binding: "Escape", action: "Cancel save" },
  { context: "File picker", binding: "Enter", action: "Navigate to typed path" },
  { context: "Dialog", binding: "Escape", action: "Cancel or dismiss the dialog" },
];
