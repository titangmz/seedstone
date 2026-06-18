/**
 * meowtar — a deterministic, fully-procedural SVG cat avatar from any string.
 *
 * The same string always yields the same cat. Every trait is drawn from SVG
 * primitives — no image or texture assets. This use case depends on the core
 * engine only (zero three.js): `resolveMeowtar` derives a config from a seed and
 * `drawCat` turns it into markup, so it runs anywhere a string and an `<svg>` do
 * (browser, server, build step). `catUseCase` wraps it in the uniform use-case
 * contract; mount it into a container or call `renderMeowtar` for a raw string.
 */

import { resolveMeowtar } from "./resolve";
import { drawCat } from "./draw";
import type { MeowtarOverrides } from "./traits";
import type { MeowtarConfig } from "./draw";

/** Render a cat to an SVG string — no DOM needed. Ideal for SSR, static export,
 *  or tests. The same pipeline `catUseCase.mount` uses. */
export function renderMeowtar(seed: string, overrides?: MeowtarOverrides): string {
  return drawCat(resolveMeowtar(seed, overrides));
}

/** Thin stateful alias for consumers that prefer an object over pure functions. */
export class Meowtar {
  seed: string;
  config: MeowtarConfig;
  private overrides?: MeowtarOverrides;

  constructor(seed: string, overrides?: MeowtarOverrides) {
    this.seed = seed;
    this.overrides = overrides;
    this.config = resolveMeowtar(seed, overrides);
  }

  update(seed: string): void {
    this.seed = seed;
    this.config = resolveMeowtar(seed, this.overrides);
  }

  setConfig(overrides?: MeowtarOverrides): void {
    this.overrides = overrides;
    this.config = resolveMeowtar(this.seed, overrides);
  }

  render(): string {
    return drawCat(this.config);
  }

  toString(): string {
    return this.render();
  }
}

export { catUseCase } from "./usecase";
export { resolveMeowtar } from "./resolve";

export { meowtarTraits } from "./traits";
export type { MeowtarTraits, MeowtarValues, MeowtarOverrides } from "./traits";
export type { Palette } from "./palette";
export type { MeowtarConfig } from "./draw";
