/**
 * @seedstone/gem (internal layer) — the gem use case. Depends on core + three.
 * Its trait declaration plus a `SceneFactory` that builds the gemstone scene.
 */

export { gemTraits } from "./traits";
export type { GemTraits, GemConfig } from "./traits";

export { gemSceneFactory } from "./scene";

export { controls } from "./controls";
export type { ControlBounds } from "./controls";

export { buildGeometry, listCuts } from "./geometries/index";
export type { GemCutModule, GemCut } from "./geometries/index";
