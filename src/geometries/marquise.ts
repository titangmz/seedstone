import * as THREE from 'three';
import type { GemCutModule } from './index';

/**
 * Marquise-cut gem geometry (navette / boat / eye shape).
 *
 * Silhouette: pointed at both ends (±X), widest at the equator (Z axis).
 * The outline is a vesica-piscis-like ellipse sharpened at the tips.
 *
 * Anatomy (same zones as brilliant, adapted for elliptical outline):
 *   Table    — flat elliptical top face (fan of triangles)
 *   Crown    — facets from table edge down to girdle
 *   Girdle   — thin equatorial band
 *   Pavilion — facets tapering to a culet ridge (line, not point)
 *
 * @param facets  Radial divisions per half (total outline = 2 × facets points).
 *                6 → sleek, 8 → rounder (default 8).
 */

// ── Proportions ───────────────────────────────────────────────────────────────
const Y_TABLE      =  0.32;
const Y_CROWN      =  0.10;
const Y_GIRDLE_TOP =  0.04;
const Y_GIRDLE_BOT = -0.04;
const Y_PAV_TOP    = -0.10;
const Y_CULET      = -0.46;

// Half-lengths of the marquise outline ellipse
const A_LONG  = 0.92;  // semi-axis along X (tip-to-tip direction)
const A_SHORT = 0.30;  // semi-axis along Z (width)

// Table is a scaled-down version of the girdle outline
const TABLE_SCALE = 0.46;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a point on the marquise outline at parametric angle t ∈ [0, 2π).
 * Uses a "squircle-like" shaping to keep the ends pointy while the sides curve.
 */
function outlinePoint(t: number, rx: number, rz: number): [number, number] {
  // cos/sin give a lens-like ellipse; this exponent keeps the shoulders broad
  // while preserving the explicit pointed vertices at +/-X.
  const ct  = Math.cos(t);
  const st  = Math.sin(t);
  const pow = 0.70;
  const x   = Math.sign(ct) * Math.pow(Math.abs(ct), pow) * rx;
  const z   = st * rz;
  return [x, z];
}

export function buildMarquiseGeometry(facets: number = 8): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];

  // Total outline has 2 × facets segments (full revolution)
  const N    = facets * 2;
  const TAU  = Math.PI * 2;
  const step = TAU / N;

  const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  function faceNormal(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a))
      .normalize();
  }

  function tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void {
    const n = faceNormal(a, b, c);
    for (const p of [a, b, c]) {
      positions.push(p.x, p.y, p.z);
      normals.push(n.x, n.y, n.z);
      uvs.push(0.5, 0.5);
    }
  }

  function quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3): void {
    tri(a, b, c);
    tri(a, c, d);
  }

  // Pre-compute outline ring points at each Y level
  function ring(rx: number, rz: number, y: number): THREE.Vector3[] {
    return Array.from({ length: N }, (_, i) => {
      const [x, z] = outlinePoint(i * step, rx, rz);
      return v3(x, y, z);
    });
  }

  const tableRing   = ring(A_LONG * TABLE_SCALE, A_SHORT * TABLE_SCALE, Y_TABLE);
  const crownRing   = ring(A_LONG,               A_SHORT,               Y_CROWN);
  const girdleTop   = ring(A_LONG,               A_SHORT,               Y_GIRDLE_TOP);
  const girdleBot   = ring(A_LONG,               A_SHORT,               Y_GIRDLE_BOT);
  const pavRing     = ring(A_LONG * 0.92,        A_SHORT * 0.92,        Y_PAV_TOP);

  // The marquise culet is a ridge line (two tip points) rather than a single point
  const culetL = v3(-A_LONG * 0.04, Y_CULET, 0);
  const culetR = v3( A_LONG * 0.04, Y_CULET, 0);

  // ── Table (flat fan from centroid) ────────────────────────────────────────
  const tableCenter = v3(0, Y_TABLE, 0);
  for (let i = 0; i < N; i++) {
    const a = tableRing[i];
    const b = tableRing[(i + 1) % N];
    // Table faces straight up
    positions.push(tableCenter.x, tableCenter.y, tableCenter.z, a.x, a.y, a.z, b.x, b.y, b.z);
    for (let k = 0; k < 3; k++) normals.push(0, 1, 0);
    uvs.push(0.5, 0.5, 0, 0, 1, 0);
  }

  // ── Crown ─────────────────────────────────────────────────────────────────
  // Each segment: table edge → crown ring → girdle top
  for (let i = 0; i < N; i++) {
    const t0 = tableRing[i];
    const t1 = tableRing[(i + 1) % N];
    const g0 = girdleTop[i];
    const g1 = girdleTop[(i + 1) % N];
    const c0 = crownRing[i];

    tri(t0, c0, t1);
    tri(t0, g0, c0);
    tri(c0, g0, g1);
    tri(c0, g1, t1);
  }

  // ── Girdle ────────────────────────────────────────────────────────────────
  for (let i = 0; i < N; i++) {
    const a = girdleTop[i];
    const b = girdleTop[(i + 1) % N];
    const c = girdleBot[(i + 1) % N];
    const d = girdleBot[i];
    quad(a, b, c, d);
  }

  // ── Pavilion → culet ridge ────────────────────────────────────────────────
  // Each outline point fans toward the nearest culet tip
  for (let i = 0; i < N; i++) {
    const g0   = girdleBot[i];
    const g1   = girdleBot[(i + 1) % N];
    const p0   = pavRing[i];
    const p1   = pavRing[(i + 1) % N];
    // Choose culet tip based on which half of the ellipse we're on
    const angle = i * step;
    const culet = Math.cos(angle) >= 0 ? culetR : culetL;

    tri(g0, p0, g1);
    tri(p0, p1, g1);
    tri(p0, culet, p1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  return geo;
}

// ── Registry contract ─────────────────────────────────────────────────────────
const mod: GemCutModule = { name: 'marquise', build: buildMarquiseGeometry };
export default mod;
