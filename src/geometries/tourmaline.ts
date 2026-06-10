import { buildBipyramid } from './lib/bipyramid';
import type { GemCutModule } from './index';

// Tourmaline grows elongated prismatic crystals — 20-face bipyramid.
const mod: GemCutModule = {
  name: 'tourmaline',
  build: () => buildBipyramid(20),
};
export default mod;
