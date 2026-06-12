import { buildBipyramid } from './lib/bipyramid';
import type { GemCutModule } from './index';

// Pyrite famously grows as perfect cubes — d6.
const mod: GemCutModule = {
  name: 'pyrite',
  build: () => buildBipyramid(6),
};
export default mod;
