import { buildBipyramid } from './lib/dice';
import type { GemCutModule } from './index';

// Fluorite cleaves along octahedral planes — d8.
const mod: GemCutModule = {
  name: 'fluorite',
  build: () => buildBipyramid(8),
};
export default mod;
