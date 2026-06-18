import { defineUseCase } from "../kit/index";
import { SeedstoneRenderer, type GemOverrides } from "./renderer";
import { gemTraits, type GemTraits, type GemConfig } from "./traits";
import { controls } from "./controls";

/**
 * The gem as a uniform use case. `SeedstoneRenderer` already satisfies the
 * `Mounted` contract (`config`/`update`/`setConfig`/`resize`/`destroy`); `mount`
 * just adapts the generic options to its constructor.
 */
export const gemUseCase = defineUseCase<GemTraits, GemConfig>({
  id: "gem",
  name: "Gemstone",
  traits: gemTraits,
  controls,
  mount: (container, seed, options = {}) =>
    new SeedstoneRenderer(seed, {
      container,
      config: options.config as GemOverrides | undefined,
      width: options.width,
      height: options.height,
      background: options.background,
      targetFPS: options.targetFPS,
      onReady: options.onReady,
    }),
});
