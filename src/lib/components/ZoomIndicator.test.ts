import { describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import ZoomIndicator from "./ZoomIndicator.svelte";

describe("ZoomIndicator", () => {
  it("shows the scale as a rounded percentage", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1, isModified: false, onReset: vi.fn(), visible: true },
    });

    expect(body).toContain("100%");
  });

  it("rounds non-integer scale percentages", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1.5, isModified: false, onReset: vi.fn(), visible: true },
    });

    expect(body).toContain("150%");
  });

  it("renders data-testid=zoom-indicator on the root element", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1, isModified: false, onReset: vi.fn(), visible: true },
    });

    expect(body).toContain('data-testid="zoom-indicator"');
  });

  it("renders data-testid=zoom-level on the percentage element", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1, isModified: false, onReset: vi.fn(), visible: true },
    });

    expect(body).toContain('data-testid="zoom-level"');
  });

  it("shows the reset button when isModified is true", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 2, isModified: true, onReset: vi.fn(), visible: true },
    });

    expect(body).toContain('data-testid="zoom-reset"');
  });

  it("hides the reset button when isModified is false", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1, isModified: false, onReset: vi.fn(), visible: true },
    });

    expect(body).not.toContain('data-testid="zoom-reset"');
  });

  it("is not rendered when visible is false", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1, isModified: false, onReset: vi.fn(), visible: false },
    });

    expect(body).not.toContain('data-testid="zoom-indicator"');
  });

  it("applies rightOffset as inline right style", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1, isModified: false, onReset: vi.fn(), visible: true, rightOffset: 268 },
    });

    expect(body).toContain("right: 268px");
  });

  it("defaults right to 10px when rightOffset is not provided", () => {
    const { body } = render(ZoomIndicator, {
      props: { scale: 1, isModified: false, onReset: vi.fn(), visible: true },
    });

    expect(body).toContain("right: 10px");
  });
});
