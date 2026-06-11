/**
 * Geometry registry for Lumina Gem — auto-discovery edition.
 *
 * HOW TO ADD A NEW CUT
 * ────────────────────
 * 1. Create `src/geometries/<name>.ts`
 * 2. Export a default object matching the `GemCutModule` contract:
 *
 *      import type { GemCutModule } from './index';
 *      const mod: GemCutModule = {
 *        name: 'mycut',
 *        build: (facets) => { … return geometry; },
 *      };
 *      export default mod;
 *
 * That's it — no edits to this file required.
 * The cut becomes available immediately and is picked by the DNA system.
 */

import * as THREE from 'three';

// ── Contract ──────────────────────────────────────────────────────────────────

export interface GemCutModule {
  /** Unique lowercase identifier, e.g. 'brilliant', 'marquise'. */
  name:  string;
  /** Build a BufferGeometry for the given radial facet count. */
  build: (facets: number) => THREE.BufferGeometry;
}

// ── Auto-discovery ────────────────────────────────────────────────────────────
// Rollup (and Vite) expand import.meta.glob at build time.
// We use a synchronous eager glob so no async is needed at runtime.

const modules = import.meta.glob<GemCutModule>('./*.ts', {
  eager: true,
  import: 'default',
});

const GEM_CUTS = new Map<string, GemCutModule>();

for (const mod of Object.values(modules)) {
  // Skip the index itself (no default export with a `name` field)
  if (mod && typeof mod.name === 'string' && typeof mod.build === 'function') {
    GEM_CUTS.set(mod.name, mod);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Union of all registered cut name strings. */
export type GemCut = string;

/**
 * Build a BufferGeometry for the given cut and facet count.
 * Falls back to `'brilliant'` if the cut name is unrecognised.
 */
export function buildGeometry(cut: GemCut, facets: number): THREE.BufferGeometry {
  const mod = GEM_CUTS.get(cut) ?? GEM_CUTS.get('brilliant')!;
  return mod.build(facets);
}

/** Returns all registered cut names, sorted alphabetically. */
export function listCuts(): string[] {
  return [...GEM_CUTS.keys()].sort();
}
