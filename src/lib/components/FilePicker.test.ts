import { describe, expect, it } from "vitest";
import filePickerSource from "./FilePicker.svelte?raw";

describe("FilePicker", () => {
  it("makes directory entries keyboard-accessible without ignored a11y warnings", () => {
    expect(filePickerSource).toContain("function handleEntryKeydown");
    expect(filePickerSource).toContain('tabindex="0"');
    expect(filePickerSource).not.toContain("svelte-ignore a11y_click_events_have_key_events");
  });

  it("supports Open and Import labelling while preserving Open defaults", () => {
    expect(filePickerSource).toMatch(/title\s*=\s*"Open file"/);
    expect(filePickerSource).toMatch(/confirmLabel\s*=\s*"Open"/);
    expect(filePickerSource).toMatch(/emptyLabel\s*=\s*"No GIF files or folders here"/);
    expect(filePickerSource).toContain("aria-label={title}");
    expect(filePickerSource).toContain("{confirmLabel}");
    expect(filePickerSource).toContain("{emptyLabel}");
  });

  it("allows callers to choose the listing command for import-aware selectors", () => {
    expect(filePickerSource).toMatch(/listCommand\s*=\s*"list_dir"/);
    expect(filePickerSource).toMatch(/invoke<DirEntry\[\]>\(listCommand/);
  });
});
