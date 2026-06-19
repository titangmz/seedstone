import type { Traits } from "./traits";

/** Slider bounds for a numeric setting in the lab UI. */
export type LabSlider = { min: number; max: number };

/** Discrete choices for an options setting in the lab UI. */
export type LabOptions = string[];

/**
 * A single lab control. Discriminated by `Array.isArray`:
 *   object → slider (number setting)
 *   array  → dropdown (options setting)
 */
export type LabControl = LabSlider | LabOptions;

/** Flat map of lab controls keyed by dot-path, e.g. `"gem.hue"`, `"gem.cut"`. */
export type LabControls = Record<string, LabControl>;

/** A live, mounted render. Update the seed or override traits; the plugin
 *  reconciles its container in place. */
export interface View<C = unknown> {
  /** The resolved config currently rendered. */
  readonly config: C;
  /** Re-render for a new seed. */
  update(seed: string): void;
  /** Replace all overrides and re-render. Accepts trait constructors
   *  (`constant`, `seeded`, `pick`). Omitting a key restores that trait to its
   *  config.ts declaration. `setConfig({})` resets everything. */
  setConfig(overrides: object): void;
  /** Resize the canvas — only present on WebGL plugins. */
  resize?(width: number, height: number): void;
  /** Tear down and release the container. */
  destroy(): void;
}

/** Options accepted by `create`. All optional — `config` overrides traits;
 *  the rest are hints a plugin may use (WebGL) or ignore (SVG/string). */
export interface CreateOptions {
  config?: object;
  width?: number;
  height?: number;
  background?: string | number | null;
  targetFPS?: number;
  onReady?: () => void;
}

/**
 * A plugin — a passive descriptor the runtime drives. Authors build one with
 * `definePlugin`; users hand it to `create`. `lab` is optional and only needed
 * for the website lab UI.
 */
export interface Plugin<T extends Traits = Traits, C = unknown> {
  /** Stable identifier, e.g. `"gem"`. */
  id: string;
  /** Human-readable label, e.g. `"Gemstone"`. */
  name: string;
  /** The trait declaration tree. */
  traits: T;
  /** Lab UI controls: sliders for numeric traits, dropdowns for options traits.
   *  Only needed for the website lab — omit for production-only plugins. */
  lab?: LabControls;
  /** Runtime hook implemented by plugin authors and invoked by `create`. It
   *  receives a resolved, validated container. End users call
   *  `create(plugin, target, seed)` rather than this directly. */
  mount(container: HTMLElement, seed: string, options?: CreateOptions): View<C>;
}
