import * as THREE from 'three';

// ── Shared helpers ────────────────────────────────────────────────────────────

function flatNormalGeo(positions: number[], normals: number[], uvs: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  return geo;
}

function pushTri(
  positions: number[], normals: number[], uvs: number[],
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
): void {
  const ux = bx-ax, uy = by-ay, uz = bz-az;
  const vx = cx-ax, vy = cy-ay, vz = cz-az;
  const len = Math.sqrt((uy*vz-uz*vy)**2 + (uz*vx-ux*vz)**2 + (ux*vy-uy*vx)**2);
  const nx = (uy*vz - uz*vy) / len;
  const ny = (uz*vx - ux*vz) / len;
  const nz = (ux*vy - uy*vx) / len;
  positions.push(ax,ay,az, bx,by,bz, cx,cy,cz);
  for (let i = 0; i < 3; i++) normals.push(nx, ny, nz);
  uvs.push(0.5,0.5, 0.5,0.5, 0.5,0.5);
}

/** Convert any Three.js indexed geometry to unindexed with flat (face) normals. */
function extractFlatNormals(geo: THREE.BufferGeometry, scale: number): THREE.BufferGeometry {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const idx = geo.getIndex();
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
  for (let i = 0; i < triCount; i++) {
    const ia = idx ? idx.getX(i*3)   : i*3;
    const ib = idx ? idx.getX(i*3+1) : i*3+1;
    const ic = idx ? idx.getX(i*3+2) : i*3+2;
    pushTri(
      positions, normals, uvs,
      pos.getX(ia)*scale, pos.getY(ia)*scale, pos.getZ(ia)*scale,
      pos.getX(ib)*scale, pos.getY(ib)*scale, pos.getZ(ib)*scale,
      pos.getX(ic)*scale, pos.getY(ic)*scale, pos.getZ(ic)*scale,
    );
  }
  return flatNormalGeo(positions, normals, uvs);
}

// ── Mode 1: Bipyramid ─────────────────────────────────────────────────────────
// k = N/2 equatorial vertices on a great circle at y=0, two apices at ±scale on Y.
// Every vertex lies on the circumsphere of radius `scale`.
//
// Winding check (k=4, i=0 upper face):
//   apex=(0,s,0)  next=(0,0,s)  curr=(s,0,0)
//   AB=(0,-s,s) × AC=(s,-s,0) = (s²,s²,s²) — outward ✓

/**
 * Bipyramid with exactly N triangular faces (k = N/2 equatorial vertices).
 *
 * Works for any even N ≥ 6 (and N = 4 as a special tetrahedron case).
 * Examples: 6 → triangular bipyramid, 8 → octahedron, 10 → d10 shape,
 *           20 → decagonal bipyramid, 100 → d100 shape.
 *
 * @param scale  Circumradius (default 0.65).
 */
export function buildBipyramid(N: number, scale = 0.65): THREE.BufferGeometry {
  if (N === 4) return extractFlatNormals(new THREE.TetrahedronGeometry(scale, 0), 1);
  if (N % 2 !== 0 || N < 6) throw new Error(`buildBipyramid: N must be 4 or an even number ≥ 6 (got ${N})`);

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

// ── Mode 2: Regular polyhedron (Platonic solid) ───────────────────────────────
// Delegates vertex/face generation to Three.js, then converts to flat normals.
//
// Cube (N=6): Three.js has no PolyhedronGeometry-based cube, so we supply the
// 8 unit-sphere vertices and 12 CCW triangle indices manually.
// All (±1,±1,±1) corners sit at distance √3, so PolyhedronGeometry normalises
// them uniformly onto the circumsphere — cube faces remain flat. ✓

const CUBE_VERTS = [
  -1,-1,-1,  1,-1,-1,  1, 1,-1, -1, 1,-1,  // back ring  (z = -1)
  -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1,  // front ring (z = +1)
];
const CUBE_TRIS = [
  0,2,1, 0,3,2,  // -z  normal (0,0,-1)
  4,5,6, 4,6,7,  // +z  normal (0,0,+1)
  0,1,5, 0,5,4,  // -y  normal (0,-1,0)
  2,3,7, 2,7,6,  // +y  normal (0,+1,0)
  1,2,6, 1,6,5,  // +x  normal (+1,0,0)
  3,0,4, 3,4,7,  // -x  normal (-1,0,0)
];

const PLATONIC_GENERATORS: Record<number, (r: number) => THREE.BufferGeometry> = {
   4: r => new THREE.TetrahedronGeometry(r, 0),
   6: r => new THREE.PolyhedronGeometry(CUBE_VERTS, CUBE_TRIS, r, 0),
   8: r => new THREE.OctahedronGeometry(r, 0),
  12: r => new THREE.DodecahedronGeometry(r, 0),
  20: r => new THREE.IcosahedronGeometry(r, 0),
};

/**
 * Regular (Platonic) polyhedron with exactly N faces, using Three.js as the
 * generation engine and flat normals for a faceted gem look.
 *
 * Valid N: 4 (tetrahedron), 6 (hexahedron/cube), 8 (octahedron),
 *          12 (dodecahedron), 20 (icosahedron).
 *
 * @param scale  Circumradius (default 0.65).
 */
export function buildRegularPolyhedron(faces: number, scale = 0.65): THREE.BufferGeometry {
  const factory = PLATONIC_GENERATORS[faces];
  if (!factory) {
    const valid = Object.keys(PLATONIC_GENERATORS).join(', ');
    throw new Error(`buildRegularPolyhedron: no regular polyhedron with ${faces} faces (valid: ${valid})`);
  }
  return extractFlatNormals(factory(scale), 1);
}
