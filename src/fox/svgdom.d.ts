/**
 * Minimal ambient types for `svgdom` (ships no declarations). svgdom is Node-only
 * and used solely by ./render for headless SVG output; the browser plugin never
 * imports it.
 */
declare module "svgdom" {
  /** Create a headless window whose document svg.js can draw into. */
  export function createSVGWindow(): Window & { document: Document };
}
