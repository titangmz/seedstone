import { buildPlatonicSolid } from './lib/platonic';
import type { GemCutModule } from './index';

// Pyrite famously grows as perfect cubes — d6.
const mod: GemCutModule = {
  name: 'pyrite',
  build: () => buildPlatonicSolid(6),
};
export default mod;
