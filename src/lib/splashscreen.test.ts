import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(
  resolve(import.meta.dirname, "../../static/splashscreen.html"),
  "utf-8",
);

describe("splashscreen", () => {
  it("should use an inline SVG rather than an <img> with a data URI", () => {
    // An img with a data URI src can be blocked by WebKitGTK's CSP even when
    // csp: null is set. Inline SVG is unaffected by img-src CSP directives.
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

  it("should wrap the SVG in a concrete-sized .logo div", () => {
    // Sizing the SVG via CSS on the SVG element itself can collapse to zero
    // in WebKitGTK flex containers when height: 100% chains break. A wrapper
    // div with explicit width/height gives the SVG a guaranteed box.
    expect(html).toMatch(/class="logo"/);
    expect(html).toMatch(/\.logo\s*\{[^}]*width:\s*100px/);
    expect(html).toMatch(/\.logo\s*\{[^}]*height:\s*100px/);
  });

  it("should use position: fixed on the splash container", () => {
    // position: fixed; inset: 0 fills the viewport independently of the
    // height chain, avoiding the WebKitGTK collapse of height: 100% on
    // html+body+div that causes flex children to shrink to zero.
    expect(html).toMatch(/\.splash\s*\{[^}]*position:\s*fixed/);
    expect(html).toMatch(/\.splash\s*\{[^}]*inset:\s*0/);
  });

  it("should use the theme background colour", () => {
    expect(html).toContain("#191a1c");
  });
});
