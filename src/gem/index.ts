/**
 * @seedstone/gem (internal layer) — the gem use case: render a 3D rotating gem
 * from a string. Owns its trait declaration, controls, geometry registry, and a
 * self-contained renderer built directly on three.js.
 */

export { gemUseCase } from "./usecase";

export { SeedstoneRenderer } from "./renderer";
export type { SeedstoneOptions, GemOverrides } from "./renderer";

export { gemTraits } from "./traits";
export type { GemTraits, GemConfig } from "./traits";

export { controls } from "./controls";

export { buildGeometry, listCuts } from "./geometries/index";
export type { GemCutModule, GemCut } from "./geometries/index";
