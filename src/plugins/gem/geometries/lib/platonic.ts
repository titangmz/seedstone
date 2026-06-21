import * as THREE from "three";
import { extractFlatNormals } from "./geometry";

// Cube (N=6): Three.js has no PolyhedronGeometry-based cube, so we supply the
// 8 unit-sphere vertices and 12 CCW triangle indices. All (±1,±1,±1) corners sit
// at distance √3, so PolyhedronGeometry normalises them uniformly onto the
// circumsphere — cube faces remain flat. ✓
const CUBE_VERTS = [
  -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
];
const CUBE_TRIS = [
  0,
  2,
  1,
  0,
  3,
  2, // -z
  4,
  5,
  6,
  4,
  6,
  7, // +z
  0,
  1,
  5,
  0,
  5,
  4, // -y
  2,
  3,
  7,
  2,
  7,
  6, // +y
  1,
  2,
  6,
  1,
  6,
  5, // +x
  3,
  0,
  4,
  3,
  4,
  7, // -x
];

const GENERATORS: Record<number, (r: number) => THREE.BufferGeometry> = {
  4: (r) => new THREE.TetrahedronGeometry(r, 0),
  6: (r) => new THREE.PolyhedronGeometry(CUBE_VERTS, CUBE_TRIS, r, 0),
  8: (r) => new THREE.OctahedronGeometry(r, 0),
  12: (r) => new THREE.DodecahedronGeometry(r, 0),
  20: (r) => new THREE.IcosahedronGeometry(r, 0),
};

/**
 * Regular (Platonic) polyhedron with exactly N faces.
 * Valid N: 4 (tetrahedron), 6 (hexahedron), 8 (octahedron),
 *          12 (dodecahedron), 20 (icosahedron).
 *
 * @param scale  Circumradius (default 0.65).
 */
export function buildRegularPolyhedron(faces: number, scale = 0.65): THREE.BufferGeometry {
  const factory = GENERATORS[faces];
  if (!factory) {
    throw new Error(
      `buildRegularPolyhedron: no regular polyhedron with ${faces} faces (valid: ${Object.keys(GENERATORS).join(", ")})`,
    );
  }
  return extractFlatNormals(factory(scale), 1);
}
