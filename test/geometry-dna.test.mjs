import assert from 'node:assert/strict';
import { buildGeometry, listCuts, stringToDNA } from '../dist/lumina-gem.esm.js';

const cuts = listCuts();
assert.deepEqual(cuts, ['brilliant', 'marquise']);

const generatedCuts = new Set();
for (let i = 0; i < 100; i++) {
  generatedCuts.add(stringToDNA(`seed-${i}`).cut);
}

assert(generatedCuts.has('brilliant'), 'seed DNA should generate brilliant cuts');
assert(generatedCuts.has('marquise'), 'seed DNA should generate marquise cuts');

function dimensions(cut) {
  const geometry = buildGeometry(cut, 8);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  assert(box, `${cut} should have a bounding box`);
  return {
    x: box.max.x - box.min.x,
    z: box.max.z - box.min.z,
  };
}

const brilliant = dimensions('brilliant');
const marquise = dimensions('marquise');

assert(
  marquise.x > brilliant.x * 1.3,
  `marquise should be visibly longer than brilliant: ${marquise.x} vs ${brilliant.x}`,
);
assert(
  marquise.z < brilliant.z * 0.7,
  `marquise should be visibly narrower than brilliant: ${marquise.z} vs ${brilliant.z}`,
);

console.log('geometry DNA ok', {
  cuts,
  generatedCuts: [...generatedCuts].sort(),
  brilliant,
  marquise,
});
