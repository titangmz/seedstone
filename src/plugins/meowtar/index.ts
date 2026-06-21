/**
 * meowtar — a deterministic, fully-procedural SVG cat avatar from any string.
 *
 * The same string always yields the same cat. Every trait is drawn from SVG
 * primitives — no image or texture assets. `renderMeowtar` runs anywhere a
 * string does (browser, server, build step). `catPlugin` wraps it in the plugin
 * contract; mount it into a container with `create(catPlugin, el, seed)`.
 */

import { resolveMeowtar } from "./config";
import { drawCat } from "./draw";
import type { MeowtarOverrides } from "./config";

/** Render a cat to an SVG string — no DOM needed. Ideal for SSR, static export,
 *  or tests. The same pipeline `catPlugin.mount` uses. */
export function renderMeowtar(seed: string, overrides?: MeowtarOverrides): string {
  return drawCat(resolveMeowtar(seed, overrides));
}

export { catPlugin } from "./plugin";

export type { MeowtarTraits, MeowtarValues, MeowtarOverrides } from "./config";
export type { Palette } from "./palette";
export type { MeowtarConfig } from "./draw";
