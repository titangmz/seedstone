import { Viewer, type ViewerOptions } from "../three/index";
import type { Override, Traits } from "../core/index";
import { gemSceneFactory } from "./scene";
import type { GemConfig, GemTraits } from "./traits";

/** Deep-partial override tree for a gem instance — pin a trait to a value or
 *  flip it with `seeded(min, max)` / `pick(options)`. */
export type GemOverrides = Override<GemTraits>;

/** Options for `new SeedstoneRenderer(seed, options)`. */
export interface SeedstoneOptions extends Omit<ViewerOptions, "config"> {
  /** Pin or seed any trait for this instance, e.g. `{ gem: { cut: 'garnet', hue: 200 } }`. */
  config?: GemOverrides;
}

/**
 * Render a 3D rotating gem from a string. A thin, back-compatible binding of the
 * generic {@link Viewer} to the gem use case — same surface as before
 * (`update`/`setConfig`/`resize`/`pause`/`play`/`destroy`, plus `seed`/`config`).
 */
export class SeedstoneRenderer extends Viewer<GemConfig> {
  constructor(seed: string, options: SeedstoneOptions) {
    super(seed, gemSceneFactory, { ...options, config: options.config as Override<Traits> });
  }

  /** Re-apply gem overrides on a live instance, replacing any previous ones. */
  override setConfig(overrides: GemOverrides = {}): void {
    super.setConfig(overrides as Override<Traits>);
  }
}
