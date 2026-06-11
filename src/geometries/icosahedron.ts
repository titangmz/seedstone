import { buildRegularPolyhedron } from './lib/dice';
import type { GemCutModule } from './index';

// Regular icosahedron — 20 triangular faces, d20.
const mod: GemCutModule = {
  name: 'icosahedron',
  build: () => buildRegularPolyhedron(20),
};
export default mod;
