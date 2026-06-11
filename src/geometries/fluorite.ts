import { buildPlatonicSolid } from './lib/platonic';
import type { GemCutModule } from './index';

// Fluorite cleaves along octahedral planes — d8.
const mod: GemCutModule = {
  name: 'fluorite',
  build: () => buildPlatonicSolid(8),
};
export default mod;
