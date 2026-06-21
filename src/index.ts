/**
 * seedstone — public entry point.
 *
 * Build any seed-driven visual with `create(plugin, el, seed)`. The gem and
 * the SVG cat are two bundled plugins; add your own with `definePlugin`.
 */

// Core engine
export {
  constant,
  seeded,
  pick,
  derive,
  merge,
  isConstant,
  isSeeded,
  isPick,
  sampleUnit,
  mulberry32,
  hash2D,
  hslToHex,
} from "./core/index";

export type {
  Trait,
  ConstantTrait,
  SeededTrait,
  PickTrait,
  Traits,
  Config,
  Override,
} from "./core/index";

// Plugin framework
export { definePlugin, create, buildLabControls } from "./core/index";
export type {
  Plugin,
  View,
  CreateOptions,
  LabControl,
  LabSlider,
  LabOptions,
  LabControls,
} from "./core/index";

// Gem plugin
export { gemPlugin, buildGeometry, listCuts } from "./plugins/gem/index";
export type { GemConfig, GemTraits, GemOverrides, GemCut, GemCutModule } from "./plugins/gem/index";

// Meowtar plugin
export { catPlugin, renderMeowtar } from "./plugins/meowtar/index";
export type {
  MeowtarConfig,
  MeowtarTraits,
  MeowtarOverrides,
  MeowtarValues,
  Palette,
} from "./plugins/meowtar/index";

// Fox plugin (SVG via svg.js)
export { foxPlugin } from "./plugins/fox/index";
export type {
  FoxConfig,
  FoxTraits,
  FoxOverrides,
  FoxValues,
  FoxPalette,
} from "./plugins/fox/index";
