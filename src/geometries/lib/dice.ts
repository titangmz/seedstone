import * as THREE from 'three';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  // flat normal via cross product (b-a) × (c-a)
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

// ── Tetrahedron (N=4) via Three.js ────────────────────────────────────────────

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

// ── Bipyramid (any even N ≥ 6) ────────────────────────────────────────────────
// k = N/2 equatorial vertices evenly spaced on the unit circle at y=0.
// Top apex at (0, +scale, 0), bottom nadir at (0, -scale, 0).
// All vertices sit on a sphere of radius `scale`.
//
// Winding verification (k=4, i=0, upper face):
//   apex=(0,s,0)  next=(0,0,s)  curr=(s,0,0)
//   AB=(0,-s,s)  AC=(s,-s,0)
//   AB×AC = (s²,s²,s²) — points outward from origin ✓

function buildBipyramid(N: number, scale: number): THREE.BufferGeometry {
  const k = N / 2;
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];

  const [apx, apy, apz] = [0, scale, 0];
  const [npx, npy, npz] = [0, -scale, 0];

  for (let i = 0; i < k; i++) {
    const a0 = (i       / k) * Math.PI * 2;
    const a1 = ((i + 1) / k) * Math.PI * 2;
    const cx = scale * Math.cos(a0), cz = scale * Math.sin(a0);
    const dx = scale * Math.cos(a1), dz = scale * Math.sin(a1);

    pushTri(positions, normals, uvs,  apx,apy,apz,  dx,0,dz,  cx,0,cz);  // upper
    pushTri(positions, normals, uvs,  npx,npy,npz,  cx,0,cz,  dx,0,dz);  // lower
  }

  return flatNormalGeo(positions, normals, uvs);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a gem/die BufferGeometry with exactly N triangular faces.
 *
 * - N = 4 : tetrahedron
 * - N even, N ≥ 6 : bipyramid with N/2 equatorial vertices
 *   e.g. 6→triangular, 8→octahedron, 10→d10, 20→d20, 100→d100
 *
 * @param scale  Circumradius of the shape (default 0.65).
 */
export function buildDiceGeometry(N: number, scale = 0.65): THREE.BufferGeometry {
  if (N === 4) return extractFlatNormals(new THREE.TetrahedronGeometry(scale, 0), 1);
  if (N % 2 !== 0 || N < 6) throw new Error(`buildDiceGeometry: N must be 4 or an even number ≥ 6 (got ${N})`);
  return buildBipyramid(N, scale);
}
