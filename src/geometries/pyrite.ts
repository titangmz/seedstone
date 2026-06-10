import { buildRegularPolyhedron } from './lib/platonic';
import type { GemCutModule } from './index';

// Pyrite famously grows cubic crystals — 6 square faces (12 triangles).
const mod: GemCutModule = {
  name: 'pyrite',
  build: () => buildRegularPolyhedron(6),
};
export default mod;
