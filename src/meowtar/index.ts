/**
 * meowtar — a deterministic, fully-procedural SVG cat avatar from any string.
 *
 * The same string always yields the same cat. Every trait is drawn from SVG
 * primitives — no image or texture assets. This use case depends on the core
 * engine only (zero three.js): `resolveMeowtar` derives a config from a seed and
 * `drawCat` turns it into markup, so it runs anywhere a string and an `<svg>` do
 * (browser, server, build step).
 */

import { merge, derive, sampleUnit } from "../core/index";
import {
  meowtarTraits,
  type MeowtarTraits,
  type MeowtarValues,
  type MeowtarOverrides,
} from "./traits";
import { buildPalette } from "./palette";
import { nameFor } from "./name";
import { drawCat, type MeowtarConfig } from "./draw";

/** Resolve a seed (and optional overrides) into a fully-derived cat config:
 *  trait values + palette + name + a placement seed for markings. */
export function resolveMeowtar(seed: string, overrides?: MeowtarOverrides): MeowtarConfig {
  const values: MeowtarValues = derive(merge<MeowtarTraits>(meowtarTraits, overrides), seed);
  const rngSeed = Math.floor(sampleUnit(seed, "meowtar.marks") * 4294967296);
  return { ...values, palette: buildPalette(values), name: nameFor(seed), rngSeed };
}

/** Render a cat to an SVG string — no DOM needed. Ideal for SSR, static export,
 *  or tests. The same pipeline the live renderer uses. */
export function renderMeowtar(seed: string, overrides?: MeowtarOverrides): string {
  return drawCat(resolveMeowtar(seed, overrides));
}

export interface MeowtarOptions {
  /** Element the cat's SVG is mounted into. Required. */
  container: HTMLElement;
  /** Pin or seed any trait for this instance, e.g. `{ coat: { pattern: 'striped' } }`. */
  config?: MeowtarOverrides;
}

/**
 * Mounts a deterministic SVG cat into a container. A cat is a pure function of
 * its seed, so `update(seed)` and `setConfig(overrides)` just rebuild the SVG
 * string and swap it in — cheap enough to call on every keystroke. No canvas, no
 * render loop.
 */
export class Meowtar {
  private container: HTMLElement;
  private overrides: MeowtarOverrides;

  /** The seed currently being rendered. Read-only. */
  seed: string;
  /** The resolved per-seed config currently being rendered. Read-only. */
  config: MeowtarConfig;

  constructor(seed: string, options: MeowtarOptions) {
    if (!options?.container) throw new Error("[meowtar] options.container is required.");
    this.container = options.container;
    this.overrides = options.config ?? {};
    this.seed = seed;
    this.config = resolveMeowtar(seed, this.overrides);
    this._paint();
  }

  private _paint(): void {
    this.container.innerHTML = drawCat(this.config);
  }

  /** The current cat as an SVG string, without touching the DOM. */
  toSvg(): string {
    return drawCat(this.config);
  }

  /** Swap to a new seed, reconciling the mounted SVG in place. */
  update(seed: string): void {
    this.seed = seed;
    this.config = resolveMeowtar(seed, this.overrides);
    this._paint();
  }

  /** Re-apply config overrides on a live instance, replacing any previous ones. */
  setConfig(overrides: MeowtarOverrides = {}): void {
    this.overrides = overrides;
    this.config = resolveMeowtar(this.seed, overrides);
    this._paint();
  }

  /** Remove the mounted SVG from the container. */
  destroy(): void {
    this.container.innerHTML = "";
  }
}

/** The cat as a registry-ready use case: its trait declaration plus a `render`
 *  that turns a resolved config into SVG. */
export const meowtarUseCase = {
  traits: meowtarTraits,
  render: (config: MeowtarConfig): string => drawCat(config),
};

export { meowtarTraits } from "./traits";
export type { MeowtarTraits, MeowtarValues, MeowtarOverrides } from "./traits";
export type { Palette } from "./palette";
export type { MeowtarConfig } from "./draw";
