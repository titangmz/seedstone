import * as THREE from "three";
import { hslToHex } from "../core/index";

/** The slice of config the environment dome needs. */
export interface EnvironmentConfig {
  domeRadius: number;
  domeSaturation: number;
  domeLightness: number;
  spotCount: number;
  spotOrbitRadius: number;
  spotSize: number;
  whiteSpotIntensity: number;
  tintSpotIntensity: number;
  tintSpotLightness: number;
  fillCount: number;
  fillRadius: number;
  fillSize: number;
  fillSaturation: number;
  fillLightness: number;
  fillHueStep: number;
  fillY: number;
  blurRadius: number;
}

/** Cross-cutting hues the dome takes from the rest of the scene. */
export interface EnvironmentInputs {
  /** Primary accent hue — tints the dome and one set of spots. */
  accent1Hue: number;
  /** Secondary accent hue — tints the other tinted spots. */
  accent2Hue: number;
  /** Base hue the lower-hemisphere fill spheres step through. */
  fillBaseHue: number;
}

/** Every value that affects the baked texture, joined into a comparable key.
 *  If this is unchanged between updates, the PMREM bake can be skipped. */
function envSignature(cfg: EnvironmentConfig, inputs: EnvironmentInputs): string {
  return [
    inputs.accent1Hue,
    inputs.accent2Hue,
    inputs.fillBaseHue,
    cfg.domeRadius,
    cfg.domeSaturation,
    cfg.domeLightness,
    cfg.spotCount,
    cfg.spotOrbitRadius,
    cfg.spotSize,
    cfg.whiteSpotIntensity,
    cfg.tintSpotIntensity,
    cfg.tintSpotLightness,
    cfg.fillCount,
    cfg.fillRadius,
    cfg.fillSize,
    cfg.fillSaturation,
    cfg.fillLightness,
    cfg.fillHueStep,
    cfg.fillY,
    cfg.blurRadius,
  ].join(",");
}

/**
 * The environment map a glassy object reflects and refracts — a dark dome
 * studded with bright HDR spots (the "studio lights" glinting off facets) and
 * dim fill spheres that tint the lower hemisphere.
 *
 * The dome and tinted spots take the accent hues; the fills step through hues
 * starting from `fillBaseHue`.
 *
 * The PMREM generator and env scene are reused across updates: a re-bake only
 * happens when a value that affects the texture actually changed (`signature`).
 */
export class Environment {
  private cfg: EnvironmentConfig;
  private pmrem: THREE.PMREMGenerator;
  private envScene: THREE.Scene;
  private target: THREE.WebGLRenderTarget | null = null;
  private signature = "";

  constructor(renderer: THREE.WebGLRenderer, cfg: EnvironmentConfig, inputs: EnvironmentInputs) {
    this.cfg = cfg;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envScene = new THREE.Scene();
    this._build(cfg, inputs);
  }

  /** (Re)populate the env scene's meshes from the current config. */
  private _build(cfg: EnvironmentConfig, inputs: EnvironmentInputs): void {
    this._clearScene();
    this.cfg = cfg;

    const domeMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: hslToHex(inputs.accent1Hue, cfg.domeSaturation, cfg.domeLightness),
    });
    this.envScene.add(new THREE.Mesh(new THREE.SphereGeometry(cfg.domeRadius, 32, 16), domeMat));

    // RGB > 1 reads as an HDR highlight after the PMREM bake.
    const w = cfg.whiteSpotIntensity;
    const whiteMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(w, w, w) });
    const tintMat = (hue: number) =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color()
          .setHSL(hue / 360, 1.0, cfg.tintSpotLightness)
          .multiplyScalar(cfg.tintSpotIntensity),
      });
    const spot1Mat = tintMat(inputs.accent1Hue);
    const spot2Mat = tintMat(inputs.accent2Hue);

    const spotGeo = new THREE.SphereGeometry(cfg.spotSize, 6, 6);
    for (let i = 0; i < cfg.spotCount; i++) {
      const theta = (i / cfg.spotCount) * Math.PI * 2;
      const phi = Math.PI * 0.25 + (i % 4) * (Math.PI * 0.12);
      const mat = i % 3 === 0 ? whiteMat : i % 3 === 1 ? spot1Mat : spot2Mat;
      const spot = new THREE.Mesh(spotGeo, mat);
      spot.position.set(
        cfg.spotOrbitRadius * Math.sin(phi) * Math.cos(theta),
        cfg.spotOrbitRadius * Math.cos(phi),
        cfg.spotOrbitRadius * Math.sin(phi) * Math.sin(theta),
      );
      this.envScene.add(spot);
    }

    const fillGeo = new THREE.SphereGeometry(cfg.fillSize, 8, 8);
    for (let i = 0; i < cfg.fillCount; i++) {
      const theta = (i / cfg.fillCount) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({
        color: hslToHex(
          (inputs.fillBaseHue + i * cfg.fillHueStep) % 360,
          cfg.fillSaturation,
          cfg.fillLightness,
        ),
      });
      const fill = new THREE.Mesh(fillGeo, mat);
      fill.position.set(
        cfg.fillRadius * Math.cos(theta),
        cfg.fillY,
        cfg.fillRadius * Math.sin(theta),
      );
      this.envScene.add(fill);
    }

    this.signature = envSignature(cfg, inputs);
  }

  /** Dispose and detach every mesh currently in the env scene. */
  private _clearScene(): void {
    for (const obj of this.envScene.children) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose();
      this.envScene.remove(obj);
    }
  }

  /** Bake the env scene into a PMREM texture, disposing the previous bake two
   *  frames later (after any in-flight renders referencing it complete). */
  private _bake(): THREE.Texture {
    const old = this.target;
    this.target = this.pmrem.fromScene(this.envScene, this.cfg.blurRadius);
    if (old) requestAnimationFrame(() => requestAnimationFrame(() => old.dispose()));
    return this.target.texture;
  }

  /** Initial bake (construction path). */
  render(): THREE.Texture {
    return this._bake();
  }

  /**
   * Reconcile to a new config and return the texture to assign to
   * `scene.environment`. Returns the existing texture untouched when nothing
   * that affects the bake changed — otherwise rebuilds the meshes (reusing the
   * generator) and re-bakes.
   */
  update(cfg: EnvironmentConfig, inputs: EnvironmentInputs): THREE.Texture {
    if (envSignature(cfg, inputs) === this.signature) return this.target!.texture;
    this._build(cfg, inputs);
    return this._bake();
  }

  dispose(): void {
    this.target?.dispose();
    this.pmrem.dispose();
    this._clearScene();
  }
}
