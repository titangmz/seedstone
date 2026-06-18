/**
 * @seedstone/three (internal layer) — the 3D toolkit. Depends on core + three.js.
 *
 * `Viewer` owns the WebGL context, camera, render loop, resize, async compile,
 * and lifecycle, and drives any use case's `Scene` built from a `SceneFactory`.
 * `Lights` / `Environment` / `Sparkles` are reusable building blocks a scene
 * composes — each takes its own config slice plus explicit cross-inputs, so none
 * are coupled to a particular use case.
 */

export { Viewer } from "./viewer";
export type { ViewerOptions } from "./viewer";

export type { SceneFactory, Scene, SceneContext, ViewerConfig } from "./contract";

export { Lights } from "./lights";
export type { LightsConfig, LightsInputs, OrbitConfig } from "./lights";

export { Environment } from "./environment";
export type { EnvironmentConfig, EnvironmentInputs } from "./environment";

export { Sparkles } from "./sparkles";
export type { SparklesConfig } from "./sparkles";
