import { buildRegularPolyhedron } from './lib/platonic';
import type { GemCutModule } from './index';

// Garnets naturally grow as dodecahedral crystals
const mod: GemCutModule = {
  name: 'garnet',
  build: () => buildRegularPolyhedron(12),
};
export default mod;
