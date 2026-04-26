import { describe, expect, it } from "vitest";
import filePickerSource from "./FilePicker.svelte?raw";

describe("FilePicker", () => {
  it("makes directory entries keyboard-accessible without ignored a11y warnings", () => {
    expect(filePickerSource).toContain("function handleEntryKeydown");
    expect(filePickerSource).toContain('tabindex="0"');
    expect(filePickerSource).not.toContain("svelte-ignore a11y_click_events_have_key_events");
  });
});
