import { definePlugin } from "../../core/index";
import { SeedstoneRenderer } from "./renderer";
import { gemTraits, type GemTraits, type GemConfig, type GemOverrides } from "./config";
import { gemLab } from "./lab";

export const gemPlugin = definePlugin<GemTraits, GemConfig>({
  id: "gem",
  name: "Gems",
  traits: gemTraits,
  lab: gemLab,
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
