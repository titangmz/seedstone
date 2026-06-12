import { buildGeodesicSphere } from './lib/geodesic';
import type { GemCutModule } from './index';

// Geodesic sphere — 80 triangular facets (detail=1), the closest round shape to a d100.
const mod: GemCutModule = {
  name: 'zircon',
  build: () => buildGeodesicSphere(0),
};
export default mod;
