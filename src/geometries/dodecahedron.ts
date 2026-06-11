import { buildRegularPolyhedron } from './lib/dice';
import type { GemCutModule } from './index';

// Regular dodecahedron — 12 pentagonal faces, d12.
const mod: GemCutModule = {
  name: 'dodecahedron',
  build: () => buildRegularPolyhedron(12),
};
export default mod;
