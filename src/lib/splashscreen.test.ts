import { describe, expect, it } from "vitest";
import splashscreenHtml from "../../static/splashscreen.html?raw";

describe("splashscreen", () => {
  it("uses an inline SVG rather than an img data URI", () => {
    expect(splashscreenHtml).toContain("<svg");
    expect(splashscreenHtml).not.toMatch(/<img[^>]+src=["']data:/);
  });

  it("does not set fill='none' on the root svg element", () => {
    const rootSvgTag = splashscreenHtml.match(/<svg[^>]*>/)?.[0];
    expect(rootSvgTag).toBeDefined();
    expect(rootSvgTag).not.toContain('fill="none"');
  });

  it("renders the branded title and version elements inline", () => {
    expect(splashscreenHtml).toContain('data-testid="splash-title"');
    expect(splashscreenHtml).toContain(">SCREENY<");
    expect(splashscreenHtml).toContain('data-testid="splash-version"');
    expect(splashscreenHtml).toContain("Loading...");
  });

  it("wraps the SVG in a concrete-sized logo container", () => {
    expect(splashscreenHtml).toMatch(/class="logo"/);
    expect(splashscreenHtml).toMatch(/\.logo\s*\{[^}]*width:\s*175px/);
    expect(splashscreenHtml).toMatch(/\.logo\s*\{[^}]*height:\s*175px/);
  });

  it("uses a fixed full-viewport splash container", () => {
    expect(splashscreenHtml).toMatch(/\.splash\s*\{[^}]*position:\s*fixed/);
    expect(splashscreenHtml).toMatch(/\.splash\s*\{[^}]*inset:\s*0/);
  });

  it("keeps overflow hidden on the splash page", () => {
    expect(splashscreenHtml).toContain("overflow: hidden");
  });

  it("uses the theme background colour", () => {
    expect(splashscreenHtml).toContain("#191a1c");
  });

  it("reads the version from the splash URL and refreshes it from Tauri", () => {
    expect(splashscreenHtml).toContain(
      'new URLSearchParams(window.location.search).get("version")',
    );
    expect(splashscreenHtml).toContain('invoke("plugin:app|version")');
  });
});
