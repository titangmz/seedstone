/**
 * seedstone — public entry point.
 *
 * The headline API renders a 3D gem from a string (`SeedstoneRenderer`). Under
 * it sit three reusable layers, each exported for advanced use and for building
 * other use cases:
 *   - the derivation engine (`constant`/`seeded`/`pick`/`derive`/`merge`) — zero three.js
 *   - the 3D toolkit (`Viewer` + `SceneFactory`)
 *   - the gem use case (its traits, controls, geometry registry)
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

// ── Three: the 3D toolkit ─────────────────────────────────────────────────────
// The generic Viewer + reusable scene blocks any 3D use case builds on.

export { Viewer, Lights, Environment, Sparkles } from "./three/index";
export type {
  ViewerOptions,
  SceneFactory,
  Scene,
  SceneContext,
  ViewerConfig,
  LightsConfig,
  LightsInputs,
  OrbitConfig,
  EnvironmentConfig,
  EnvironmentInputs,
  SparklesConfig,
} from "./three/index";

// ── Gem internals (advanced) ──────────────────────────────────────────────────

export { gemSceneFactory } from "./gem/scene";
export type { GemCutModule, GemCut } from "./gem/geometries/index";
