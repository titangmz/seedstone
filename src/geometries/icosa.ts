import { buildPlatonicSolid } from './lib/platonic';
import type { GemCutModule } from './index';

// 20-faced icosahedron — d20.
const mod: GemCutModule = {
  name: 'icosa',
  build: () => buildPlatonicSolid(20),
};
export default mod;
