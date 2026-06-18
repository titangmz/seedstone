import * as THREE from "three";
import { hslToHex } from "../core/index";
import type { GemConfig } from "./traits";

/** Every value that affects the baked texture, joined into a comparable key.
 *  If this is unchanged between updates, the PMREM bake can be skipped. */
function envSignature(cfg: GemConfig): string {
  const e = cfg.environment;
  return [
    cfg.lights.accent1Hue,
    cfg.lights.accent2HueOffset,
    cfg.gem.hue,
    e.domeRadius,
    e.domeSaturation,
    e.domeLightness,
    e.spotCount,
    e.spotOrbitRadius,
    e.spotSize,
    e.whiteSpotIntensity,
    e.tintSpotIntensity,
    e.tintSpotLightness,
    e.fillCount,
    e.fillRadius,
    e.fillSize,
    e.fillSaturation,
    e.fillLightness,
    e.fillHueStep,
    e.fillY,
    e.blurRadius,
  ].join(",");
}

/**
 * The environment map the gem reflects and refracts — a dark dome studded with
 * bright HDR spots (the "studio lights" you see glinting off facets) and dim
 * fill spheres that tint the lower hemisphere.
 *
 * The dome and tinted spots take the accent light hues; the fills step through
 * hues starting from the gem's body hue.
 *
 * The PMREM generator and env scene are reused across updates: a re-bake only
 * happens when a value that affects the texture actually changed (`signature`).
 */
export class Environment {
  private cfg: GemConfig["environment"];
  private pmrem: THREE.PMREMGenerator;
  private envScene: THREE.Scene;
  private target: THREE.WebGLRenderTarget | null = null;
  private signature = "";

  constructor(renderer: THREE.WebGLRenderer, cfg: GemConfig) {
    this.cfg = cfg.environment;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envScene = new THREE.Scene();
    this._build(cfg);
  }

  /** (Re)populate the env scene's meshes from the current config. */
  private _build(cfg: GemConfig): void {
    this._clearScene();
    this.cfg = cfg.environment;
    const env = cfg.environment;

    const accent1Hue = cfg.lights.accent1Hue;
    const accent2Hue = (accent1Hue + cfg.lights.accent2HueOffset) % 360;

    const domeMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: hslToHex(accent1Hue, env.domeSaturation, env.domeLightness),
    });
    this.envScene.add(new THREE.Mesh(new THREE.SphereGeometry(env.domeRadius, 32, 16), domeMat));

    // RGB > 1 reads as an HDR highlight after the PMREM bake.
    const w = env.whiteSpotIntensity;
    const whiteMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(w, w, w) });
    const tintMat = (hue: number) =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color()
          .setHSL(hue / 360, 1.0, env.tintSpotLightness)
          .multiplyScalar(env.tintSpotIntensity),
      });
    const spot1Mat = tintMat(accent1Hue);
    const spot2Mat = tintMat(accent2Hue);

    const spotGeo = new THREE.SphereGeometry(env.spotSize, 6, 6);
    for (let i = 0; i < env.spotCount; i++) {
      const theta = (i / env.spotCount) * Math.PI * 2;
      const phi = Math.PI * 0.25 + (i % 4) * (Math.PI * 0.12);
      const mat = i % 3 === 0 ? whiteMat : i % 3 === 1 ? spot1Mat : spot2Mat;
      const spot = new THREE.Mesh(spotGeo, mat);
      spot.position.set(
        env.spotOrbitRadius * Math.sin(phi) * Math.cos(theta),
        env.spotOrbitRadius * Math.cos(phi),
        env.spotOrbitRadius * Math.sin(phi) * Math.sin(theta),
      );
      this.envScene.add(spot);
    }

    const fillGeo = new THREE.SphereGeometry(env.fillSize, 8, 8);
    for (let i = 0; i < env.fillCount; i++) {
      const theta = (i / env.fillCount) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({
        color: hslToHex(
          (cfg.gem.hue + i * env.fillHueStep) % 360,
          env.fillSaturation,
          env.fillLightness,
        ),
      });
      const fill = new THREE.Mesh(fillGeo, mat);
      fill.position.set(
        env.fillRadius * Math.cos(theta),
        env.fillY,
        env.fillRadius * Math.sin(theta),
      );
      this.envScene.add(fill);
    }

    this.signature = envSignature(cfg);
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
  update(cfg: GemConfig): THREE.Texture {
    if (envSignature(cfg) === this.signature) return this.target!.texture;
    this._build(cfg);
    return this._bake();
  }

  dispose(): void {
    this.target?.dispose();
    this.pmrem.dispose();
    this._clearScene();
  }
}
