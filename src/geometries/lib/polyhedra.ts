import * as THREE from 'three';
import type { GemCutModule } from '../index';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A vertex position. Can be a plain tuple [x, y, z] or a factory function
 * that receives the current `facets` count so procedural cuts can scale their
 * vertex rings dynamically.
 */
export type VertexDef =
  | [number, number, number]
  | ((facets: number) => [number, number, number]);

/**
 * A face is an ordered list of vertex indices (≥3).
 * Winding must be CCW when viewed from outside — flat normals are auto-computed.
 *
 * Polygons with more than 4 vertices are fan-triangulated from index 0.
 *   [0,1,2,3,4]  →  tri(0,1,2)  tri(0,2,3)  tri(0,3,4)
 *
 * Can also be a factory receiving `facets` for procedural face lists.
 */
export type FaceDef =
  | number[]
  | ((facets: number) => number[][]);

/**
 * Full polyhedra definition passed to `buildPolyhedra`.
 *
 * @example — static icosahedron-style gem
 * ```ts
 * const def: PolyhedraDef = {
 *   name: 'mygem',
 *   vertices: [
 *     [0, 1, 0],      // 0 — apex
 *     [1, 0, 1],      // 1
 *     ...
 *   ],
 *   faces: [
 *     [0, 1, 2],
 *     [0, 2, 3],
 *     ...
 *   ],
 * };
 * ```
 *
 * @example — procedural (facets-aware) cut
 * ```ts
 * const def: PolyhedraDef = {
 *   name: 'procedural',
 *   vertices: (facets) => {
 *     const pts: [number,number,number][] = [[0, 1, 0]]; // apex
 *     for (let i = 0; i < facets; i++) {
 *       const a = (i / facets) * Math.PI * 2;
 *       pts.push([Math.cos(a), 0, Math.sin(a)]);
 *     }
 *     pts.push([0, -1, 0]); // nadir
 *     return pts;
 *   },
 *   faces: (facets) => {
 *     const f: number[][] = [];
 *     for (let i = 0; i < facets; i++) {
 *       f.push([0, 1 + i, 1 + ((i + 1) % facets)]);          // top cap
 *       f.push([1 + ((i+1) % facets), 1+i, facets+1]);        // bottom cap
 *     }
 *     return f;
 *   },
 * };
 * ```
 */
export interface PolyhedraDef {
  /** Unique lowercase identifier — becomes `GemCutModule.name`. */
  name: string;

  /**
   * Vertex list or a factory receiving `facets`.
   * When a plain array, the same vertex set is used for all facet counts.
   */
  vertices:
    | [number, number, number][]
    | ((facets: number) => [number, number, number][]);

  /**
   * Face list (each entry is a CCW index polygon) or a factory receiving
   * `facets` that returns the full face list for that resolution.
   */
  faces:
    | number[][]
    | ((facets: number) => number[][]);

  /**
   * Optional per-face UV override.  Return [u,v] for each vertex of the face.
   * Defaults to barycentric-ish [0.5,0.5] for every vertex (flat colour-safe).
   */
  uvs?: (faceIndex: number, vertexIndex: number) => [number, number];
}

// ── Core builder ──────────────────────────────────────────────────────────────

/**
 * Convert a `PolyhedraDef` into a flat `THREE.BufferGeometry` with
 * auto-computed flat normals — the same approach used in `brilliant.ts`.
 */
export function buildPolyhedra(
  def: PolyhedraDef,
  facets: number = 8,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];

  // Resolve dynamic or static definitions
  const verts: [number, number, number][] =
    typeof def.vertices === 'function' ? def.vertices(facets) : def.vertices;

  const faceList: number[][] =
    typeof def.faces === 'function' ? def.faces(facets) : def.faces;

  const v3 = ([x, y, z]: [number, number, number]) =>
    new THREE.Vector3(x, y, z);

  const faceNormal = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
  ): THREE.Vector3 =>
    new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a))
      .normalize();

  faceList.forEach((face, fi) => {
    if (face.length < 3) return; // degenerate — skip silently

    // Fan-triangulate: (0,1,2), (0,2,3), (0,3,4) …
    for (let k = 1; k < face.length - 1; k++) {
      const ia = face[0];
      const ib = face[k];
      const ic = face[k + 1];

      const a = v3(verts[ia]);
      const b = v3(verts[ib]);
      const c = v3(verts[ic]);
      const n = faceNormal(a, b, c);

      const triVerts   = [a, b, c];
      const localIdxs  = [0, k, k + 1]; // local position inside face polygon

      for (let t = 0; t < 3; t++) {
        const p = triVerts[t];
        positions.push(p.x, p.y, p.z);
        normals.push(n.x, n.y, n.z);

        const uv = def.uvs
          ? def.uvs(fi, localIdxs[t])
          : ([0.5, 0.5] as [number, number]);
        uvs.push(uv[0], uv[1]);
      }
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  return geo;
}

// ── Module factory ────────────────────────────────────────────────────────────

/**
 * Wrap a `PolyhedraDef` into a `GemCutModule` ready for auto-discovery.
 *
 * Typical usage at the bottom of a cut file:
 *
 * ```ts
 * export default createCutModule(myDef);
 * ```
 */
export function createCutModule(def: PolyhedraDef): GemCutModule {
  return {
    name:  def.name,
    build: (facets: number) => buildPolyhedra(def, facets),
  };
}