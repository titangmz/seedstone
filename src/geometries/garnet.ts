import { buildRegularPolyhedron } from './lib/platonic';
import type { GemCutModule } from './index';

// Garnets naturally grow as dodecahedral crystals — regular d12.
const mod: GemCutModule = {
  name: 'garnet',
  build: () => buildRegularPolyhedron(12),
};
export default mod;
