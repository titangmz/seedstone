import { buildBipyramid } from './lib/dice';
import type { GemCutModule } from './index';

// 20-faced icosahedron — d20.
const mod: GemCutModule = {
  name: 'icosa',
  build: () => buildBipyramid(20),
};
export default mod;
