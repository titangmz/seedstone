import * as THREE from 'three';
import type { SeedstoneConfig } from '../config';
import type { GemDNA } from '../dna';

type SparklesConfig = SeedstoneConfig['sparkles'];

/** mulberry32 — tiny deterministic PRNG, so the same seed gives the same sky. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A shell of tiny points floating around the gem, seeded from the DNA. */
export class Sparkles {
  private cfg:       SparklesConfig;
  private points:    THREE.Points;
  private positions: THREE.BufferAttribute;
  private material:  THREE.PointsMaterial;

  constructor(scene: THREE.Scene, dna: GemDNA, cfg: SparklesConfig) {
    this.cfg = cfg;
    this.positions = new THREE.BufferAttribute(new Float32Array(cfg.count * 3), 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', this.positions);

    this.material = new THREE.PointsMaterial({
      color: 0xffffff, size: cfg.size, transparent: true,
      opacity: cfg.baseOpacity, sizeAttenuation: true,
    });
    this.points = new THREE.Points(geometry, this.material);
    scene.add(this.points);

    this.applyDNA(dna);
  }

  /** Re-scatter the points deterministically from the DNA's noise seed. */
  applyDNA(dna: GemDNA): void {
    const rand = mulberry32(Math.floor(dna.noiseSeed * 0xffffffff));
    for (let i = 0; i < this.cfg.count; i++) {
      const r     = this.cfg.radiusMin + rand() * this.cfg.radiusRange;
      const theta = rand() * Math.PI * 2;
      const phi   = Math.acos(2 * rand() - 1);   // uniform on the sphere
      this.positions.setXYZ(
        i,
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    }
    this.positions.needsUpdate = true;
  }

  animate(t: number): void {
    this.points.rotation.y = t * this.cfg.driftRate;
    this.material.opacity  = this.cfg.baseOpacity + Math.sin(t * this.cfg.pulseRate) * this.cfg.pulseAmount;
  }

  dispose(): void {
    this.points.removeFromParent();
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
