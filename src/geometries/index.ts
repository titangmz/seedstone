/**
 * Geometry registry for Lumina Gem.
 *
 * To add a new cut:
 *   1. Create `src/geometries/<name>.ts` exporting `build<Name>Geometry(facets)`
 *   2. Add an entry to the `GEM_CUTS` map below.
 *   3. The renderer will automatically pick it up via `buildGeometry(cut, facets)`.
 */

import * as THREE from 'three';
import { buildBrilliantGeometry } from './brilliant';

// ── Cut registry ─────────────────────────────────────────────────────────────

/** All supported cut names. Extend this union as new cuts are added. */
export type GemCut = 'brilliant';

type GeometryFactory = (facets: number) => THREE.BufferGeometry;

const GEM_CUTS: Record<GemCut, GeometryFactory> = {
  brilliant: buildBrilliantGeometry,
};

/**
 * Build a BufferGeometry for the given cut and facet count.
 * Falls back to `'brilliant'` if the cut is unrecognised.
 */
export function buildGeometry(cut: GemCut, facets: number): THREE.BufferGeometry {
  const factory = GEM_CUTS[cut] ?? GEM_CUTS['brilliant'];
  return factory(facets);
}

/** Returns all registered cut names. */
export function listCuts(): GemCut[] {
  return Object.keys(GEM_CUTS) as GemCut[];
}

// Re-export individual builders for direct use
export { buildBrilliantGeometry };
