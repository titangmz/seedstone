import { buildBipyramid } from './lib/bipyramid';
import type { GemCutModule } from './index';

// Tourmaline crystals grow as elongated bipyramidal prisms
const mod: GemCutModule = {
  name: 'tourmaline',
  build: () => buildBipyramid(20),
};
export default mod;
