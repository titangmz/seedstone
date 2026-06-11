import { buildRegularPolyhedron } from './lib/dice';
import type { GemCutModule } from './index';

// Regular hexahedron (cube) — 6 square faces, d6.
const mod: GemCutModule = {
  name: 'hexahedron',
  build: () => buildRegularPolyhedron(6),
};
export default mod;
