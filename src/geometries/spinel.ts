import { buildBipyramid } from './lib/bipyramid';
import type { GemCutModule } from './index';

// Spinel crystals grow as tetrahedra — d4.
const mod: GemCutModule = {
  name: 'spinel',
  build: () => buildBipyramid(4),
};
export default mod;
