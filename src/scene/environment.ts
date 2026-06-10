import * as THREE from 'three';
import { hslToHex } from './color';
import type { SeedstoneConfig } from '../config';
import type { GemDNA } from '../dna';

type EnvironmentConfig = SeedstoneConfig['environment'];

/**
 * The environment map the gem reflects and refracts — a dark dome studded
 * with bright HDR spots (the "studio lights" you see glinting off facets)
 * and dim fill spheres that tint the lower hemisphere.
 *
 * The env scene is built once. DNA changes only retint its materials, so a
 * re-bake is just one small PMREM pass — cheap enough to run on every
 * update() and keep reflections in sync with the seed.
 */
export class Environment {
  private cfg:      EnvironmentConfig;
  private pmrem:    THREE.PMREMGenerator;
  private envScene: THREE.Scene;
  private domeMat:  THREE.MeshBasicMaterial;
  private spot1Mat: THREE.MeshBasicMaterial;
  private spot2Mat: THREE.MeshBasicMaterial;
  private fillMats: THREE.MeshBasicMaterial[] = [];
  private target:   THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, cfg: EnvironmentConfig) {
    this.cfg      = cfg;
    this.pmrem    = new THREE.PMREMGenerator(renderer);
    this.envScene = new THREE.Scene();

    this.domeMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    this.envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(cfg.domeRadius, 32, 16), this.domeMat,
    ));

    // RGB > 1 reads as an HDR highlight after the PMREM bake.
    const w = cfg.whiteSpotIntensity;
    const whiteMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(w, w, w) });
    this.spot1Mat  = new THREE.MeshBasicMaterial();
    this.spot2Mat  = new THREE.MeshBasicMaterial();

    const spotGeo = new THREE.SphereGeometry(cfg.spotSize, 6, 6);
    for (let i = 0; i < cfg.spotCount; i++) {
      const theta = (i / cfg.spotCount) * Math.PI * 2;
      const phi   = Math.PI * 0.25 + (i % 4) * (Math.PI * 0.12);
      const mat   = i % 3 === 0 ? whiteMat : i % 3 === 1 ? this.spot1Mat : this.spot2Mat;
      const spot  = new THREE.Mesh(spotGeo, mat);
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
      const mat   = new THREE.MeshBasicMaterial();
      this.fillMats.push(mat);
      const fill = new THREE.Mesh(fillGeo, mat);
      fill.position.set(cfg.fillRadius * Math.cos(theta), cfg.fillY, cfg.fillRadius * Math.sin(theta));
      this.envScene.add(fill);
    }
  }

  /** Retint the env materials from DNA. Call render() afterwards to bake. */
  applyDNA(dna: GemDNA): void {
    const cfg = this.cfg;
    this.domeMat.color.setHex(hslToHex(dna.light1Hue, cfg.domeSaturation, cfg.domeLightness));
    this.spot1Mat.color
      .setHSL(dna.light1Hue / 360, 1.0, cfg.tintSpotLightness)
      .multiplyScalar(cfg.tintSpotIntensity);
    this.spot2Mat.color
      .setHSL(dna.light2Hue / 360, 1.0, cfg.tintSpotLightness)
      .multiplyScalar(cfg.tintSpotIntensity);
    this.fillMats.forEach((mat, i) =>
      mat.color.setHSL(((dna.hue + i * cfg.fillHueStep) % 360) / 360, cfg.fillSaturation, cfg.fillLightness));
  }

  /**
   * Bake the env scene into a PMREM texture and return it.
   * The previous bake is disposed two frames later, after any in-flight
   * renders that still reference it have completed.
   */
  render(): THREE.Texture {
    const old = this.target;
    this.target = this.pmrem.fromScene(this.envScene, this.cfg.blurRadius);
    if (old) requestAnimationFrame(() => requestAnimationFrame(() => old.dispose()));
    return this.target.texture;
  }

  dispose(): void {
    this.target?.dispose();
    this.pmrem.dispose();
    this.envScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose();
    });
  }
}
