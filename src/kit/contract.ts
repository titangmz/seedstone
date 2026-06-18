/**
 * The use-case contract — what every Seedstone use case (gem, cat, …) implements
 * so hosts can treat them uniformly. Purely functional: identity, the trait
 * declaration, and how to render. No website/presentation concerns live here.
 *
 * Depends only on `core` (for the trait types). The future `@seedstone/kit`.
 */

import type { Traits } from "../core/index";

/** Slider bounds for a `constant` trait — optional UI metadata for config tools. */
export interface ControlBounds {
  min: number;
  max: number;
  step: number;
}

/** A live, mounted render. A host updates the seed or overrides; the use case
 *  reconciles its container in place. */
export interface Mounted<C = unknown> {
  /** The resolved config currently rendered. */
  readonly config: C;
  /** Re-render for a new seed. */
  update(seed: string): void;
  /** Replace the instance overrides and re-render. */
  setConfig(overrides: object): void;
  /** Resize, where it applies (WebGL use cases). SVG/string use cases omit it. */
  resize?(width: number, height: number): void;
  /** Tear down and release the container. */
  destroy(): void;
}

/** Options accepted by `mount`. All optional — `config` pins/seeds traits; the
 *  rest are hints a use case may use (WebGL ones) or ignore (string ones). */
export interface MountOptions {
  config?: object;
  width?: number;
  height?: number;
  background?: string | number | null;
  targetFPS?: number;
  onReady?: () => void;
}

/**
 * A use case as a library consumer sees it. This is the whole functional
 * surface — everything you need to render and tune one. Anything a *website*
 * wants (hero copy, sample seeds, a summary panel) is the host's concern and
 * lives in the host, never here.
 */
export interface UseCase<T extends Traits = Traits, C = unknown> {
  /** Stable identifier, e.g. "gem". */
  id: string;
  /** Human-readable label, e.g. "Gemstone". */
  name: string;
  /** The trait declaration — drives any config UI built against the use case. */
  traits: T;
  /** Optional slider bounds for `constant` traits, keyed by dot-path. */
  controls?: Record<string, ControlBounds>;
  /** Mount a live, seed-driven render into a container. */
  mount(container: HTMLElement, seed: string, options?: MountOptions): Mounted<C>;
}
