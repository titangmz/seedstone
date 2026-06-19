/**
 * Headless render — produce a fox as an SVG string, no browser required.
 *
 * svgdom supplies a DOM so svg.js can draw in Node; `registerWindow` points
 * svg.js at it. This is the SSR / static-export / test path, and it shares the
 * exact `drawFox` code the browser plugin uses. svgdom is Node-only (it reads
 * font files from disk), so this module must never be pulled into a browser
 * bundle — it is intentionally not re-exported from `./index` or `src/index`.
 */

import { createSVGWindow } from "svgdom";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { resolveFox, type FoxOverrides } from "./config";
import { drawFox } from "./draw";

/** Render a fox to an SVG string. Ideal for SSR, static export, or tests. */
export function renderFox(seed: string, overrides?: FoxOverrides): string {
  const window = createSVGWindow();
  registerWindow(window, window.document);
  const canvas = SVG(window.document.documentElement) as Svg;
  canvas.viewbox(0, 0, 256, 256).attr({ width: "100%", height: "100%" });
  drawFox(canvas, resolveFox(seed, overrides));
  return canvas.svg();
}
