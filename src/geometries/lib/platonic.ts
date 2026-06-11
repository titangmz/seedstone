import * as THREE from 'three';
import { buildPolyhedra } from './polyhedra';

const PHI = (1 + Math.sqrt(5)) / 2;
const S3  = Math.sqrt(3);
const IS  = Math.sqrt(1 + PHI * PHI);  // icosahedron sphere radius

// Vertices are on the unit sphere for each solid.
// buildPlatonicSolid() scales them uniformly before building.

const SOLIDS: Record<number, {
  vertices: [number, number, number][];
  faces: number[][];
}> = {

  // ── Tetrahedron (d4) ── alternating-sign cube corners ─────────────────────
  4: {
    vertices: [
      [ 1/S3,  1/S3,  1/S3],  // 0
      [ 1/S3, -1/S3, -1/S3],  // 1
      [-1/S3,  1/S3, -1/S3],  // 2
      [-1/S3, -1/S3,  1/S3],  // 3
    ],
    faces: [
      [0, 1, 2],
      [0, 3, 1],
      [0, 2, 3],
      [1, 3, 2],
    ],
  },

  // ── Cube (d6) ─────────────────────────────────────────────────────────────
  6: {
    vertices: [
      [-1/S3, -1/S3, -1/S3],  // 0
      [ 1/S3, -1/S3, -1/S3],  // 1
      [ 1/S3,  1/S3, -1/S3],  // 2
      [-1/S3,  1/S3, -1/S3],  // 3
      [-1/S3, -1/S3,  1/S3],  // 4
      [ 1/S3, -1/S3,  1/S3],  // 5
      [ 1/S3,  1/S3,  1/S3],  // 6
      [-1/S3,  1/S3,  1/S3],  // 7
    ],
    faces: [
      [1, 5, 4, 0],  // -y
      [3, 7, 6, 2],  // +y
      [4, 5, 6, 7],  // +z
      [0, 3, 2, 1],  // -z
      [1, 2, 6, 5],  // +x
      [4, 7, 3, 0],  // -x
    ],
  },

  // ── Octahedron (d8) ───────────────────────────────────────────────────────
  8: {
    vertices: [
      [ 1,  0,  0],  // 0
      [-1,  0,  0],  // 1
      [ 0,  1,  0],  // 2  top
      [ 0, -1,  0],  // 3  bottom
      [ 0,  0,  1],  // 4
      [ 0,  0, -1],  // 5
    ],
    faces: [
      [2, 4, 0], [2, 0, 5], [2, 5, 1], [2, 1, 4],  // upper belt
      [3, 0, 4], [3, 5, 0], [3, 1, 5], [3, 4, 1],  // lower belt
    ],
  },

  // ── Icosahedron (d20) — Three.js vertex convention ───────────────────────
  20: {
    vertices: [
      [-1/IS,  PHI/IS,      0],  //  0
      [ 1/IS,  PHI/IS,      0],  //  1
      [-1/IS, -PHI/IS,      0],  //  2
      [ 1/IS, -PHI/IS,      0],  //  3
      [     0, -1/IS,  PHI/IS],  //  4
      [     0,  1/IS,  PHI/IS],  //  5
      [     0, -1/IS, -PHI/IS],  //  6
      [     0,  1/IS, -PHI/IS],  //  7
      [ PHI/IS,     0,  -1/IS],  //  8
      [ PHI/IS,     0,   1/IS],  //  9
      [-PHI/IS,     0,  -1/IS],  // 10
      [-PHI/IS,     0,   1/IS],  // 11
    ],
    faces: [
      [ 0, 11,  5], [ 0,  5,  1], [ 0,  1,  7], [ 0,  7, 10], [ 0, 10, 11],
      [ 1,  5,  9], [ 5, 11,  4], [11, 10,  2], [10,  7,  6], [ 7,  1,  8],
      [ 3,  9,  4], [ 3,  4,  2], [ 3,  2,  6], [ 3,  6,  8], [ 3,  8,  9],
      [ 4,  9,  5], [ 2,  4, 11], [ 6,  2, 10], [ 8,  6,  7], [ 9,  8,  1],
    ],
  },
};

/**
 * Build a BufferGeometry for a regular Platonic solid.
 * @param sides  Number of faces: 4, 6, 8, or 20.
 * @param scale  Uniform scale applied to all vertices (default 0.65, matching gem girdle radius).
 */
export function buildPlatonicSolid(sides: number, scale = 0.65): THREE.BufferGeometry {
  const solid = SOLIDS[sides];
  if (!solid) throw new Error(`buildPlatonicSolid: no solid with ${sides} faces (valid: ${Object.keys(SOLIDS).join(', ')})`);
  const verts = solid.vertices.map(([x, y, z]) => [x * scale, y * scale, z * scale] as [number, number, number]);
  return buildPolyhedra({ name: '', vertices: verts, faces: solid.faces });
}
