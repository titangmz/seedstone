import { buildBipyramid } from './lib/dice';
import type { GemCutModule } from './index';

// Spinel crystals grow as tetrahedra — d4.
const mod: GemCutModule = {
  name: 'spinel',
  build: () => buildBipyramid(4),
};
export default mod;
