import * as THREE from 'three';
import { buildGeometry } from '../geometries/index';
import { applyDistortions } from '../geometries/lib/distort';
import type { SeedstoneConfig } from '../config';
import type { GemDNA } from '../dna';

type GemConfig = SeedstoneConfig['gem'];

/** Build and distort the geometry for the given DNA (CPU work, a few ms). */
export function buildGemGeometry(dna: GemDNA): THREE.BufferGeometry {
  const geometry = buildGeometry(dna.cut);
  applyDistortions(geometry, dna);
  return geometry;
}

/**
 * The gemstone itself: a physically-based transmission material plus a
 * barely-visible wireframe child that adds a hint of facet-edge definition.
 */
export class Gem {
  private cfg:       GemConfig;
  private mesh:      THREE.Mesh;
  private wireframe: THREE.Mesh;     // child of mesh, shares its geometry
  private material:  THREE.MeshPhysicalMaterial;

  constructor(scene: THREE.Scene, dna: GemDNA, cfg: GemConfig) {
    this.cfg = cfg;
    this.material = new THREE.MeshPhysicalMaterial({
      ...cfg.material,
      metalness:   0.0,
      roughness:   0.0,
      transparent: true,
      side:        THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(buildGemGeometry(dna), this.material);

    this.wireframe = new THREE.Mesh(this.mesh.geometry, new THREE.MeshBasicMaterial({
      color: 0xffffff, wireframe: true, transparent: true, opacity: cfg.wireframeOpacity,
    }));
    this.mesh.add(this.wireframe);
    scene.add(this.mesh);

    this.applyDNA(dna);
  }

  /**
   * Write DNA-derived material values as plain property updates.
   * Three.js uploads them as uniforms on the next render — no needsUpdate,
   * which would force a full initMaterial() / shader re-validation.
   */
  applyDNA(dna: GemDNA): void {
    this.material.color.setHSL(dna.hue / 360, dna.saturation * this.cfg.bodySaturationScale, this.cfg.bodyLightness);
    this.material.attenuationColor.setHSL(dna.hue / 360, 1.0, this.cfg.attenuationLightness);
    this.material.ior         = dna.ior;
    this.material.iridescence = dna.brilliance;
    this.mesh.rotation.z      = dna.tilt;
  }

  /**
   * Swap in a new geometry. The old buffers are disposed two frames later,
   * after in-flight GPU draw calls that still use them have completed.
   */
  setGeometry(geometry: THREE.BufferGeometry): void {
    const old = this.mesh.geometry;
    this.mesh.geometry      = geometry;
    this.wireframe.geometry = geometry;
    requestAnimationFrame(() => requestAnimationFrame(() => old.dispose()));
  }

  animate(t: number, dna: GemDNA): void {
    this.mesh.rotation.y = t * dna.speed * this.cfg.spinRate;
    this.mesh.rotation.x = Math.sin(t * this.cfg.wobbleRate) * this.cfg.wobbleAmount + dna.tilt;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
    (this.wireframe.material as THREE.Material).dispose();
  }
}
