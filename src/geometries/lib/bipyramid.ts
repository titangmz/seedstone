import * as THREE from 'three';
import { flatNormalGeo, pushTri } from './geometry';

/**
 * Bipyramid with exactly N triangular faces (k = N/2 equatorial vertices).
 *
 * Works for any even N ≥ 6.
 * k equatorial vertices sit on a great circle at y = 0; two apices at ±scale on Y.
 * All vertices lie on the circumsphere of radius `scale`.
 *
 * Examples: 6 → triangular bipyramid, 8 → octahedron, 20 → d20 shape.
 *
 * Winding check (k=4, i=0, upper face):
 *   apex=(0,s,0)  next=(0,0,s)  curr=(s,0,0)
 *   AB=(0,−s,s) × AC=(s,−s,0) = (s²,s²,s²) — outward ✓
 */
export function buildBipyramid(N: number, scale = 0.65): THREE.BufferGeometry {
  if (N % 2 !== 0 || N < 6) throw new Error(`buildBipyramid: N must be an even number ≥ 6 (got ${N})`);

  const k = N / 2;
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];

  for (let i = 0; i < k; i++) {
    const a0 = (i       / k) * Math.PI * 2;
    const a1 = ((i + 1) / k) * Math.PI * 2;
    const cx = scale * Math.cos(a0), cz = scale * Math.sin(a0);
    const dx = scale * Math.cos(a1), dz = scale * Math.sin(a1);
    pushTri(positions, normals, uvs,  0, scale, 0,  dx,0,dz,  cx,0,cz);  // upper
    pushTri(positions, normals, uvs,  0,-scale, 0,  cx,0,cz,  dx,0,dz);  // lower
  }

  return flatNormalGeo(positions, normals, uvs);
}
