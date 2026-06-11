import { buildDiceGeometry } from './lib/dice';
import type { GemCutModule } from './index';

// Spinel crystals grow as tetrahedra — d4.
const mod: GemCutModule = {
  name: 'spinel',
  build: () => buildDiceGeometry(4),
};
export default mod;
