import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGeometry, listCuts, stringToDNA } from '../dist/seedstone.esm.js';

const EXPECTED_CUTS = ['citrine', 'fluorite', 'garnet', 'pyrite', 'spinel', 'tanzanite', 'tourmaline', 'zircon'];

// Triangles per cut. Geometries are unindexed, so triangles = positions / 3.
const EXPECTED_TRIANGLES = {
  citrine:    16,   // pentagonal antiprism: 2×3 cap + 2×5 belt
  fluorite:   8,    // octahedron
  garnet:     36,   // dodecahedron: 12 pentagons × 3
  pyrite:     12,   // cube: 6 squares × 2
  spinel:     4,    // tetrahedron
  tanzanite:  20,   // icosahedron
  tourmaline: 20,   // 20-face bipyramid
  zircon:     80,   // geodesic sphere, detail 1
};

function triangleCount(geometry) {
  return geometry.getAttribute('position').count / 3;
}

test('registry lists all cuts alphabetically', () => {
  assert.deepEqual(listCuts(), EXPECTED_CUTS);
});

test('stringToDNA is deterministic', () => {
  for (const seed of ['alice', 'hello world', '0x1a2b3c', '✦']) {
    assert.deepEqual(stringToDNA(seed), stringToDNA(seed));
  }
  assert.notDeepEqual(stringToDNA('alice'), stringToDNA('bob'));
});

test('empty seed falls back to "seedstone"', () => {
  assert.deepEqual(stringToDNA(''), stringToDNA('seedstone'));
});

test('DNA traits stay within their documented ranges', () => {
  const cuts = listCuts();
  for (let i = 0; i < 50; i++) {
    const dna = stringToDNA(`seed-${i}`);
    assert(cuts.includes(dna.cut), `cut '${dna.cut}' should be registered`);
    assert(dna.hue >= 0 && dna.hue < 360);
    assert(dna.saturation >= 0.55 && dna.saturation <= 1.0);
    assert(dna.speed >= 0.6 && dna.speed <= 1.4);
    assert(dna.ior >= 1.8 && dna.ior <= 2.8);
    assert(dna.brilliance >= 0.3 && dna.brilliance <= 1.0);
    assert(dna.perfection >= 0 && dna.perfection <= 1);
  }
});

test('every cut builds the expected number of triangles', () => {
  for (const cut of listCuts()) {
    assert.equal(
      triangleCount(buildGeometry(cut)), EXPECTED_TRIANGLES[cut],
      `${cut} triangle count`,
    );
  }
});

test('every cut has a non-degenerate bounding box', () => {
  for (const cut of listCuts()) {
    const geometry = buildGeometry(cut);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    assert(box.max.x - box.min.x > 0, `${cut} x extent`);
    assert(box.max.y - box.min.y > 0, `${cut} y extent`);
    assert(box.max.z - box.min.z > 0, `${cut} z extent`);
  }
});

test('no two cuts produce identical geometry', () => {
  const seen = new Map();
  for (const cut of listCuts()) {
    const key = Array.from(buildGeometry(cut).getAttribute('position').array).join(',');
    assert(!seen.has(key), `${cut} duplicates ${seen.get(key)}`);
    seen.set(key, cut);
  }
});

test('unknown cut falls back to a valid geometry', () => {
  const geometry = buildGeometry('not-a-real-cut');
  assert(triangleCount(geometry) > 0);
});
