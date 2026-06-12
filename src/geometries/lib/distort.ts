import * as THREE from 'three';

// ── Tuning knobs ──────────────────────────────────────────────────────────────
// Adjust these to change the range of distortion at perfection = 0.

/** Max per-axis scale deviation from 1.0. 0.25 = ±25% stretch/squash. */
export const MAX_SCALE_JITTER = 0.85;

/** Max vertex displacement in model-space units. Gem radius is ~0.65. */
export const MAX_VERTEX_NOISE = 0.15;

// ── Internal hash ─────────────────────────────────────────────────────────────

function u32(n: number): number {
  n = n >>> 0;
  n = (Math.imul(((n >>> 16) ^ n) >>> 0, 0x45d9f3b)) >>> 0;
  n = (Math.imul(((n >>> 16) ^ n) >>> 0, 0x45d9f3b)) >>> 0;
  return ((n >>> 16) ^ n) >>> 0;
}

/** Deterministic float in [0, 1) from two integers. */
function h01(seed: number, i: number): number {
  return u32((seed * 65537 + i) >>> 0) / 4294967295;
}

// ── Scale distortion ──────────────────────────────────────────────────────────

function applyScale(
  geo: THREE.BufferGeometry,
  sx: number, sy: number, sz: number,
): void {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, pos.getX(i) * sx, pos.getY(i) * sy, pos.getZ(i) * sz);
  }
  pos.needsUpdate = true;
}

// ── Vertex noise ──────────────────────────────────────────────────────────────

/**
 * Perturbs each unique vertex position by a seeded random displacement.
 * Vertices that share a position get the same displacement so face connectivity
 * is preserved — no gaps appear between adjacent faces.
 */
function applyVertexNoise(
  geo: THREE.BufferGeometry,
  amplitude: number,
  seed: number,
): void {
  if (amplitude <= 0) return;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const SNAP = 1e4;

  const groups = new Map<string, [number, number, number]>();

  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * SNAP)},${Math.round(pos.getY(i) * SNAP)},${Math.round(pos.getZ(i) * SNAP)}`;
    if (!groups.has(key)) {
      const gi = groups.size;
      let dx = h01(seed, gi * 3 + 0) - 0.5;
      let dy = h01(seed, gi * 3 + 1) - 0.5;
      let dz = h01(seed, gi * 3 + 2) - 0.5;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      groups.set(key, [dx / len * amplitude, dy / len * amplitude, dz / len * amplitude]);
    }
    const [dx, dy, dz] = groups.get(key)!;
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  pos.needsUpdate = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface DistortDNA {
  /** 0 = rough/distorted, 1 = flawless. Scales both effects down to zero. */
  perfection: number;
  /** Per-axis scale seeds (0–1). Combined with perfection. */
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  /** Seed for vertex noise directions (0–1). */
  noiseSeed: number;
}

/**
 * Applies scale and vertex distortions in-place, then recomputes flat normals.
 * At perfection=1 the geometry is untouched (both effects collapse to zero).
 */
export function applyDistortions(geo: THREE.BufferGeometry, dna: DistortDNA): void {
  const p = dna.perfection; // 0 = rough, 1 = perfect

  // Non-uniform scale: each axis deviates from 1.0 proportionally to (1-perfection).
  // Dividing by the geometric mean keeps volume constant — uniform scale collapses
  // to identity so the gem always stays inside the same bounding box.
  const sx0 = 1 + (dna.scaleX - 0.5) * 2 * MAX_SCALE_JITTER * (1 - p);
  const sy0 = 1 + (dna.scaleY - 0.5) * 2 * MAX_SCALE_JITTER * (1 - p);
  const sz0 = 1 + (dna.scaleZ - 0.5) * 2 * MAX_SCALE_JITTER * (1 - p);
  const gm  = Math.cbrt(sx0 * sy0 * sz0);
  applyScale(geo, sx0 / gm, sy0 / gm, sz0 / gm);

  // Vertex noise: amplitude shrinks to zero as perfection → 1
  applyVertexNoise(geo, MAX_VERTEX_NOISE * (1 - p), Math.floor(dna.noiseSeed * 65536));

  // Recompute flat normals: Three.js computeVertexNormals() assigns the face
  // normal to all three vertices for unindexed geometry — correct for faceted gems.
  geo.computeVertexNormals();
}
