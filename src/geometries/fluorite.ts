import { buildBipyramid } from './lib/bipyramid';
import type { GemCutModule } from './index';

// Fluorite cleaves along octahedral planes
const mod: GemCutModule = {
  name: 'fluorite',
  build: () => buildBipyramid(8),
};
export default mod;
