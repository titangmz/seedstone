import { buildPlatonicSolid } from './lib/platonic';
import type { GemCutModule } from './index';

// Spinel crystals grow as tetrahedra — d4.
const mod: GemCutModule = {
  name: 'spinel',
  build: () => buildPlatonicSolid(4),
};
export default mod;
