/**
 * seedstone — public entry point.
 *
 * The headline API renders a 3D gem from a string (`SeedstoneRenderer`). Under it
 * sits the derivation engine (`constant`/`seeded`/`pick`/`derive`/`merge`) — a
 * zero-dependency, three.js-free core, exported for advanced use and for building
 * other use cases from a seed.
 */

// ── Gem: render a gem from a string ───────────────────────────────────────────

export { SeedstoneRenderer } from "./gem/renderer";
export type { SeedstoneOptions } from "./gem/renderer";

// The gem's trait declaration. `configSchema` is the back-compat alias.
export { gemTraits, gemTraits as configSchema } from "./gem/traits";
export { controls } from "./gem/controls";
export { listCuts, buildGeometry } from "./gem/geometries/index";

export type {
  GemConfig as SeedstoneConfig, // a gem's fully-resolved values (hue, speed, …)
  GemTraits as SeedstoneSchema, // the raw trait tree (traits still wrapped)
} from "./gem/traits";
export type { GemOverrides as SeedstoneConfigOverrides } from "./gem/renderer";
export type { ControlBounds } from "./gem/controls";
export type { GemCutModule, GemCut } from "./gem/geometries/index";

// ── Core: the derivation engine (zero three.js) ───────────────────────────────
// Import these to declare your own traits and "just get a config" from a seed.

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
