import { buildDiceGeometry } from './lib/dice';
import type { GemCutModule } from './index';

// Fluorite cleaves along octahedral planes — d8.
const mod: GemCutModule = {
  name: 'fluorite',
  build: () => buildDiceGeometry(8),
};
export default mod;
