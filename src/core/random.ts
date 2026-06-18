/**
 * Deterministic primitives — the foundation of seed → output mapping.
 *
 * Pure and three.js-free, so image/data use cases can derive a config and place
 * points without pulling in a renderer. Every consumer (the param engine, the
 * gem's sparkle scatter, the gem's vertex distortion) shares these, so a seed
 * always maps to the same result regardless of which use case asks.
 */

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h;
}

/** One mulberry32 scramble — decorrelates similar hash inputs. */
function scramble(seed: number): number {
  let z = (seed + 0x6d2b79f5) >>> 0;
  z = Math.imul(z ^ (z >>> 15), z | 1);
  z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
  return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
}

/**
 * Deterministic uniform float in [0, 1) for a seed + label pair.
 *
 * Each label hashes independently, so traits never influence each other:
 * adding, removing, or re-ordering sampled values leaves all others unchanged.
 * An empty seed falls back to 'seedstone'.
 */
export function sampleUnit(seed: string, label: string): number {
  return scramble(djb2(`${label}:${seed.length === 0 ? "seedstone" : seed}`));
}

/**
 * mulberry32 — a tiny deterministic stream PRNG. Seed it with an integer and
 * call the returned function for a fresh uniform float in [0, 1) each time, so
 * the same seed always reproduces the same sequence (e.g. a sparkle scatter).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer avalanche hash → uniform 32-bit unsigned int. */
function hashU32(n: number): number {
  n = n >>> 0;
  n = Math.imul(((n >>> 16) ^ n) >>> 0, 0x45d9f3b) >>> 0;
  n = Math.imul(((n >>> 16) ^ n) >>> 0, 0x45d9f3b) >>> 0;
  return ((n >>> 16) ^ n) >>> 0;
}

/** Deterministic float in [0, 1) from two integers — stateless, indexable. */
export function hash2D(seed: number, i: number): number {
  return hashU32((seed * 65537 + i) >>> 0) / 4294967295;
}
