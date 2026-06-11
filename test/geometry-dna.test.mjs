import assert from 'node:assert/strict';
import { buildGeometry, listCuts, stringToDNA } from '../dist/lumina-gem.esm.js';

const cuts = listCuts();
assert.deepEqual(cuts, ['fluorite', 'icosa', 'pyrite', 'spinel']);

// stringToDNA should return one of the registered cuts
for (let i = 0; i < 20; i++) {
  const dna = stringToDNA(`seed-${i}`);
  assert(cuts.includes(dna.cut), `stringToDNA should return a registered cut, got '${dna.cut}'`);
}

function dimensions(cut) {
  const geometry = buildGeometry(cut, 8);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  assert(box, `${cut} should have a bounding box`);
  return {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
  };
}

// All cuts should produce geometry with a non-degenerate bounding box
for (const cut of cuts) {
  const dim = dimensions(cut);
  assert(dim.x > 0, `${cut} should have non-zero x extent`);
  assert(dim.y > 0, `${cut} should have non-zero y extent`);
  assert(dim.z > 0, `${cut} should have non-zero z extent`);
}

// bipyramid shapes should be symmetric (x ≈ z)
const fluorite = dimensions('fluorite');
assert(
  Math.abs(fluorite.x - fluorite.z) < 0.01,
  `fluorite (d8 bipyramid) should be radially symmetric: x=${fluorite.x} z=${fluorite.z}`,
);

console.log('geometry DNA ok', {
  cuts,
  dimensions: Object.fromEntries(cuts.map(c => [c, dimensions(c)])),
});
