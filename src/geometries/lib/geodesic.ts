import * as THREE from 'three';
import { extractFlatNormals } from './geometry';

/**
 * Geodesic sphere — icosahedron subdivided `detail` times.
 * Face count = 20 × 4^detail  (0→20, 1→80, 2→320, 3→1280 …).
 * Each subdivision level doubles the edge count, producing a progressively
 * rounder, more sphere-like shape.
 *
 * @param detail  Subdivision level ≥ 0.
 * @param scale   Circumradius (default 0.65).
 */
export function buildGeodesicSphere(detail: number, scale = 0.65): THREE.BufferGeometry {
  if (!Number.isInteger(detail) || detail < 0)
    throw new Error(`buildGeodesicSphere: detail must be a non-negative integer (got ${detail})`);
  return extractFlatNormals(new THREE.IcosahedronGeometry(scale, detail), 1);
}
