/**
 * The boundary contract between the 3D toolkit (`Viewer`) and a use case.
 *
 * A 3D use case provides a `SceneFactory`: its trait declaration plus a
 * `createScene` that, given a resolved config and the viewer's three.js context,
 * builds a `Scene`. The `Viewer` owns the renderer, camera, render loop, resize,
 * shader compile, and lifecycle; the `Scene` owns everything inside it.
 */

import * as THREE from "three";
import type { Traits } from "../core/index";

/** Renderer/camera settings every 3D use case must expose so the `Viewer` can
 *  set up the WebGL context and camera. The gem carries these in its traits. */
export interface ViewerConfig {
  renderer: {
    toneMappingExposure: number;
    transmissionResolutionScale: number;
    defaultSize: number;
    maxPixelRatio: number;
    maxFrameDelta: number;
  };
  camera: {
    fov: number;
    near: number;
    far: number;
    position: [number, number, number];
    lookAt: [number, number, number];
  };
}

/** The three.js context the `Viewer` hands to a use case's `createScene`. */
export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

/** A live, mounted scene. The `Viewer` drives these on the existing context. */
export interface Scene<C extends ViewerConfig = ViewerConfig> {
  /** Cheap re-apply on seed/override change — reconcile in place, off the render path. */
  update(config: C): void;
  /** Advance to animation time `t` (seconds). Called once per rendered frame. */
  animate(t: number): void;
  /** Release all GPU resources. */
  dispose(): void;
}

/** What a use case exports to be driven by the `Viewer`. */
export interface SceneFactory<C extends ViewerConfig = ViewerConfig> {
  /** The use case's trait declaration (resolves to a `C`). */
  traits: Traits;
  /** Build the scene from a resolved config and the viewer's context. */
  createScene(config: C, ctx: SceneContext): Scene<C>;
}
