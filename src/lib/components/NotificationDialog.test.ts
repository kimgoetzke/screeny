import { describe, it, expect, vi } from "vitest";
import { render } from "svelte/server";
import NotificationDialog from "./NotificationDialog.svelte";

describe("NotificationDialog", () => {
  describe("message", () => {
    it("renders the message", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Something went wrong.",
          confirmLabel: "OK",
          onConfirm: vi.fn(),
        },
      });
      expect(body).toContain("Something went wrong.");
    });

    it("renders a multi-line message", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Line one.\nLine two.",
          confirmLabel: "OK",
          onConfirm: vi.fn(),
        },
      });
      expect(body).toContain("Line one.\nLine two.");
    });
  });

  describe("1-button mode (no cancelLabel)", () => {
    it("renders the confirm button with the correct label", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Done.",
          confirmLabel: "OK",
          onConfirm: vi.fn(),
        },
      });
      expect(body).toContain('data-testid="btn-dialog-confirm"');
      expect(body).toContain("OK");
    });

    it("does not render a cancel button", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Done.",
          confirmLabel: "OK",
          onConfirm: vi.fn(),
        },
      });
      expect(body).not.toContain('data-testid="btn-dialog-cancel"');
    });
  });

  describe("2-button mode (with cancelLabel)", () => {
    it("renders the cancel button with the correct label", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Are you sure?",
          confirmLabel: "Continue",
          cancelLabel: "Cancel",
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        },
      });
      expect(body).toContain('data-testid="btn-dialog-cancel"');
      expect(body).toContain("Cancel");
    });

    it("renders the confirm button with the correct label", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Are you sure?",
          confirmLabel: "Continue",
          cancelLabel: "Cancel",
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        },
      });
      expect(body).toContain('data-testid="btn-dialog-confirm"');
      expect(body).toContain("Continue");
    });

    it("renders custom Yes/No labels", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Delete this frame?",
          confirmLabel: "Yes",
          cancelLabel: "No",
          onConfirm: vi.fn(),
          onCancel: vi.fn(),
        },
      });
      expect(body).toContain("Yes");
      expect(body).toContain("No");
    });
  });

  describe("backdrop", () => {
    it("renders the backdrop", () => {
      const { body } = render(NotificationDialog, {
        props: {
          message: "Test",
          confirmLabel: "OK",
          onConfirm: vi.fn(),
        },
      });
      expect(body).toContain('data-testid="dialog-backdrop"');
    });
  });
});
