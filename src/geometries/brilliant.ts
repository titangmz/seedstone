import * as THREE from 'three';

/**
 * Brilliant-cut gem geometry (round brilliant / diamond silhouette).
 *
 * Anatomy:
 *   Table    — flat octagonal/n-gonal top face
 *   Crown    — star + kite facets from table edge down to girdle
 *   Girdle   — thin equatorial band
 *   Pavilion — main + lower facets tapering to culet point
 *
 * @param facets  Number of radial divisions: 6 (hexagonal), 7, or 8 (default).
 */
// ── Geometry constants ────────────────────────────────────────────────────────
// Proportions are loosely based on a standard round brilliant diamond:
//   - Total height   ≈ 1.0 unit, centred at Y=0
//   - Crown height   ≈ 43% of total (yTable=0.38 → yGirdleTop=0.05)
//   - Pavilion depth ≈ 47% of total (yGirdleBot=-0.05 → yCulet=-0.52)
//   - Girdle band    ≈ 10% — thin equatorial edge
//
// Radii follow the ~60% table-to-girdle ratio common in brilliant cuts.

const Y_TABLE      =  0.38;  // top of table (flat face)
const Y_CROWN      =  0.12;  // crown peak ridge
const Y_GIRDLE_TOP =  0.05;  // top of girdle band
const Y_GIRDLE_BOT = -0.05;  // bottom of girdle band
const Y_PAV_TOP    = -0.08;  // pavilion main facet base
const Y_CULET      = -0.52;  // culet point (bottom tip)

const R_TABLE  = 0.38;  // table inscribed radius (~62% of girdle radius)
const R_CROWN  = 0.60;  // crown facet peak radius
const R_GIRDLE = 0.62;  // maximum width (girdle radius = 1.0 normalised unit)
const R_PAV    = 0.58;  // pavilion facet peak radius

// ─────────────────────────────────────────────────────────────────────────────

export function buildBrilliantGeometry(facets: number = 8): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];

  const TAU        = Math.PI * 2;
  const HALF_STEP  = Math.PI / facets; // half angular step — offsets crown/pav peaks

  const rad = (i: number, n: number, offset = 0) => (i / n) * TAU + offset;
  const v3  = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  /** Flat face normal computed from 3 CCW vertices. */
  function faceNormal(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a))
      .normalize();
  }

  /** Push one triangle with auto-computed flat normal. */
  function tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void {
    const n = faceNormal(a, b, c);
    for (const p of [a, b, c]) {
      positions.push(p.x, p.y, p.z);
      normals.push(n.x, n.y, n.z);
      uvs.push(0.5, 0.5);
    }
  }

  /** Push two triangles (a quad split along a–c diagonal). */
  function quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3): void {
    tri(a, b, c);
    tri(a, c, d);
  }

  // ── Table (flat top fan) ──────────────────────────────────────────────────
  // The table faces straight up — normal is always (0,1,0), not computed.
  for (let i = 0; i < facets; i++) {
    const a = v3(R_TABLE * Math.cos(rad(i,   facets)), Y_TABLE, R_TABLE * Math.sin(rad(i,   facets)));
    const b = v3(R_TABLE * Math.cos(rad(i+1, facets)), Y_TABLE, R_TABLE * Math.sin(rad(i+1, facets)));
    positions.push(0, Y_TABLE, 0,  a.x, a.y, a.z,  b.x, b.y, b.z);
    for (let k = 0; k < 3; k++) normals.push(0, 1, 0);
    uvs.push(0.5, 0.5,  0, 0,  1, 0);
  }

  // ── Crown (pentagon per segment → 4 triangles) ───────────────────────────
  // Each segment forms a pentagon: t0 → c0 → t1 → g1 → g0
  //
  //    t0 ──── c0 ──── t1      (table edge, crown peak, table edge)
  //     \      / \      /
  //      \    /   \    /
  //       g0 ─────── g1        (girdle edge)
  //
  // c0 is the crown "star" peak, angularly offset by HALF_STEP between t0/t1.
  for (let i = 0; i < facets; i++) {
    const t0 = v3(R_TABLE  * Math.cos(rad(i,   facets)),                Y_TABLE,      R_TABLE  * Math.sin(rad(i,   facets)));
    const t1 = v3(R_TABLE  * Math.cos(rad(i+1, facets)),                Y_TABLE,      R_TABLE  * Math.sin(rad(i+1, facets)));
    const g0 = v3(R_GIRDLE * Math.cos(rad(i,   facets)),                Y_GIRDLE_TOP, R_GIRDLE * Math.sin(rad(i,   facets)));
    const g1 = v3(R_GIRDLE * Math.cos(rad(i+1, facets)),                Y_GIRDLE_TOP, R_GIRDLE * Math.sin(rad(i+1, facets)));
    const c0 = v3(R_CROWN  * Math.cos(rad(i,   facets) + HALF_STEP),   Y_CROWN,      R_CROWN  * Math.sin(rad(i,   facets) + HALF_STEP));

    tri(t0, c0, t1);  // upper star facet  (t0–c0–t1)
    tri(t0, g0, c0);  // left kite         (t0–g0–c0)
    tri(c0, g0, g1);  // lower-left kite   (c0–g0–g1)
    tri(c0, g1, t1);  // lower-right kite  (c0–g1–t1)
  }

  // ── Girdle (thin equatorial band) ─────────────────────────────────────────
  for (let i = 0; i < facets; i++) {
    const a = v3(R_GIRDLE * Math.cos(rad(i,   facets)), Y_GIRDLE_TOP, R_GIRDLE * Math.sin(rad(i,   facets)));
    const b = v3(R_GIRDLE * Math.cos(rad(i+1, facets)), Y_GIRDLE_TOP, R_GIRDLE * Math.sin(rad(i+1, facets)));
    const c = v3(R_GIRDLE * Math.cos(rad(i+1, facets)), Y_GIRDLE_BOT, R_GIRDLE * Math.sin(rad(i+1, facets)));
    const d = v3(R_GIRDLE * Math.cos(rad(i,   facets)), Y_GIRDLE_BOT, R_GIRDLE * Math.sin(rad(i,   facets)));
    quad(a, b, c, d);
  }

  // ── Pavilion (girdle → culet, 3 triangles per segment) ───────────────────
  // p0 is the pavilion "main" facet peak, half-stepped like the crown peaks.
  const culet = v3(0, Y_CULET, 0);
  for (let i = 0; i < facets; i++) {
    const g0 = v3(R_GIRDLE * Math.cos(rad(i,   facets)),              Y_GIRDLE_BOT, R_GIRDLE * Math.sin(rad(i,   facets)));
    const g1 = v3(R_GIRDLE * Math.cos(rad(i+1, facets)),              Y_GIRDLE_BOT, R_GIRDLE * Math.sin(rad(i+1, facets)));
    const p0 = v3(R_PAV    * Math.cos(rad(i,   facets) + HALF_STEP), Y_PAV_TOP,    R_PAV    * Math.sin(rad(i,   facets) + HALF_STEP));

    tri(g0, p0, g1);    // upper pavilion main facet
    tri(p0, culet, g1); // lower-right to culet
    tri(g0, culet, p0); // lower-left to culet
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  return geo;
}
