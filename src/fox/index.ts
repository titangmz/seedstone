/**
 * @seedstone/fox — a deterministic, fully-procedural SVG fox avatar from any
 * string, drawn with the svg.js element API.
 *
 * `foxPlugin` mounts into a container with `create(foxPlugin, el, seed)`. The
 * headless string renderer (`renderFox`) lives in ./render and is intentionally
 * not re-exported here: it depends on svgdom, which is Node-only and must stay
 * out of browser bundles.
 */

export { foxPlugin } from "./plugin";

export type { FoxTraits, FoxValues, FoxOverrides } from "./config";
export type { FoxConfig } from "./draw";
export type { Palette as FoxPalette } from "./palette";
