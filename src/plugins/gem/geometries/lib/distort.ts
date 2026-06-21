import * as THREE from "three";
import { hash2D } from "../../../../core/random";

// ── Tuning knobs ──────────────────────────────────────────────────────────────
// Adjust these to change the range of distortion at perfection = 0.

/** Max per-axis scale deviation from 1.0. 0.25 = ±25% stretch/squash. */
export const MAX_SCALE_JITTER = 0.85;

/** Max vertex displacement in model-space units. Gem radius is ~0.65. */
export const MAX_VERTEX_NOISE = 0.15;

// ── Scale distortion ──────────────────────────────────────────────────────────

function applyScale(geo: THREE.BufferGeometry, sx: number, sy: number, sz: number): void {
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
function applyVertexNoise(geo: THREE.BufferGeometry, amplitude: number, seed: number): void {
  if (amplitude <= 0) return;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const SNAP = 1e4;

  const groups = new Map<string, [number, number, number]>();

  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * SNAP)},${Math.round(pos.getY(i) * SNAP)},${Math.round(pos.getZ(i) * SNAP)}`;
    if (!groups.has(key)) {
      const gi = groups.size;
      let dx = hash2D(seed, gi * 3 + 0) - 0.5;
      let dy = hash2D(seed, gi * 3 + 1) - 0.5;
      let dz = hash2D(seed, gi * 3 + 2) - 0.5;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      groups.set(key, [(dx / len) * amplitude, (dy / len) * amplitude, (dz / len) * amplitude]);
    }
    const [dx, dy, dz] = groups.get(key)!;
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  pos.needsUpdate = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface Distortion {
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
export function applyDistortions(geo: THREE.BufferGeometry, distortion: Distortion): void {
  const p = distortion.perfection; // 0 = rough, 1 = perfect

  // Capture original extents before any changes.
  geo.computeBoundingBox();
  const origSize = new THREE.Vector3();
  geo.boundingBox!.getSize(origSize);

  // Non-uniform scale: each axis deviates from 1.0 proportionally to (1-perfection).
  // Dividing by the geometric mean keeps volume constant — uniform scale = identity.
  const sx0 = 1 + (distortion.scaleX - 0.5) * 2 * MAX_SCALE_JITTER * (1 - p);
  const sy0 = 1 + (distortion.scaleY - 0.5) * 2 * MAX_SCALE_JITTER * (1 - p);
  const sz0 = 1 + (distortion.scaleZ - 0.5) * 2 * MAX_SCALE_JITTER * (1 - p);
  const gm = Math.cbrt(sx0 * sy0 * sz0);
  applyScale(geo, sx0 / gm, sy0 / gm, sz0 / gm);

  // Vertex noise: amplitude shrinks to zero as perfection → 1
  applyVertexNoise(geo, MAX_VERTEX_NOISE * (1 - p), Math.floor(distortion.noiseSeed * 65536));

  // Fit back into original bounding box: if any axis grew, uniformly scale down
  // so the largest overrun sits exactly at the original extent.
  geo.computeBoundingBox();
  const newSize = new THREE.Vector3();
  geo.boundingBox!.getSize(newSize);
  const fit = Math.min(
    newSize.x > 0 ? origSize.x / newSize.x : 1,
    newSize.y > 0 ? origSize.y / newSize.y : 1,
    newSize.z > 0 ? origSize.z / newSize.z : 1,
  );
  if (fit < 1) applyScale(geo, fit, fit, fit);

  // Recompute flat normals after all spatial changes.
  geo.computeVertexNormals();
}
