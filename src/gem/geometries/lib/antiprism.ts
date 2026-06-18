import * as THREE from "three";
import { flatNormalGeo, pushTri } from "./geometry";

/**
 * Regular n-antiprism: two parallel n-gon caps connected by a belt of
 * 2n triangles. The bottom ring is rotated π/n relative to the top so that
 * each side face is equilateral (when r and h are tuned correctly).
 *
 * Face count: 2*(n-2) cap triangles + 2n side triangles = 4n-4 total.
 * n=5 → 16 faces, n=6 → 20 faces.
 *
 * Winding verified for outward normals on all three face types (see comments).
 */
export function buildAntiprism(n: number, scale = 0.65): THREE.BufferGeometry {
  if (n < 3) throw new Error(`buildAntiprism: n must be ≥ 3 (got ${n})`);

  const r = scale * 0.84; // equatorial radius
  const h = scale * 0.48; // half-height

  // Build ring vertices
  const top: [number, number, number][] = [];
  const bot: [number, number, number][] = [];
  for (let k = 0; k < n; k++) {
    const at = (k / n) * Math.PI * 2;
    const ab = at + Math.PI / n; // bottom ring offset by half a step
    top.push([r * Math.cos(at), h, r * Math.sin(at)]);
    bot.push([r * Math.cos(ab), -h, r * Math.sin(ab)]);
  }

  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [];

  // ── Top cap ───────────────────────────────────────────────────────────────
  // Fan from top[0]. Winding (top[0], top[k+1], top[k]) → normal points +Y.
  for (let k = 1; k < n - 1; k++) {
    pushTri(
      positions,
      normals,
      uvs,
      top[0][0],
      top[0][1],
      top[0][2],
      top[k + 1][0],
      top[k + 1][1],
      top[k + 1][2],
      top[k][0],
      top[k][1],
      top[k][2],
    );
  }

  // ── Bottom cap ────────────────────────────────────────────────────────────
  // Fan from bot[0]. Winding (bot[0], bot[k], bot[k+1]) → normal points -Y.
  for (let k = 1; k < n - 1; k++) {
    pushTri(
      positions,
      normals,
      uvs,
      bot[0][0],
      bot[0][1],
      bot[0][2],
      bot[k][0],
      bot[k][1],
      bot[k][2],
      bot[k + 1][0],
      bot[k + 1][1],
      bot[k + 1][2],
    );
  }

  // ── Side belt: alternating up/down triangles ──────────────────────────────
  for (let k = 0; k < n; k++) {
    const kn = (k + 1) % n;
    // "Up" tri: top[k] → top[kn] → bot[k] → outward radial normal ✓
    pushTri(
      positions,
      normals,
      uvs,
      top[k][0],
      top[k][1],
      top[k][2],
      top[kn][0],
      top[kn][1],
      top[kn][2],
      bot[k][0],
      bot[k][1],
      bot[k][2],
    );
    // "Down" tri: top[kn] → bot[kn] → bot[k] → outward radial normal ✓
    pushTri(
      positions,
      normals,
      uvs,
      top[kn][0],
      top[kn][1],
      top[kn][2],
      bot[kn][0],
      bot[kn][1],
      bot[kn][2],
      bot[k][0],
      bot[k][1],
      bot[k][2],
    );
  }

  return flatNormalGeo(positions, normals, uvs);
}
