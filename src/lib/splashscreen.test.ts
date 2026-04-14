import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Read once for all assertions
const html = readFileSync(
  resolve(import.meta.dirname, "../../static/splashscreen.html"),
  "utf-8",
);

describe("splashscreen", () => {
  it("should use an inline SVG rather than an <img> with a data URI", () => {
    // <img src="data:..."> can be blocked by Tauri/WebKitGTK CSP even when
    // csp: null is set, making the image invisible. Inline SVG is unaffected
    // by img-src CSP directives and always renders.
    expect(html).toContain("<svg");
    expect(html).not.toMatch(/<img[^>]+src=["']data:/);
  });

  it("should not set fill='none' on the root <svg> element", () => {
    // fill="none" is a presentational attribute that cascades to all
    // descendant elements in some WebKit versions, making every path
    // invisible on the dark background despite their own fill attributes.
    const rootSvgTag = html.match(/<svg[^>]*>/)?.[0];
    expect(rootSvgTag).toBeDefined();
    expect(rootSvgTag).not.toContain('fill="none"');
  });

  it("should set explicit width and height attributes on the <svg> element", () => {
    // CSS-only sizing (width/height via a stylesheet rule) can collapse to
    // zero in certain WebKit flex container layouts. HTML attributes are
    // always honoured as the intrinsic size.
    const rootSvgTag = html.match(/<svg[^>]*>/)?.[0];
    expect(rootSvgTag).toBeDefined();
    expect(rootSvgTag).toMatch(/\bwidth="\d+"/);
    expect(rootSvgTag).toMatch(/\bheight="\d+"/);
  });

  it("should use the theme background colour", () => {
    expect(html).toContain("#191a1c");
  });
});
