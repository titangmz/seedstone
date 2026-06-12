import { buildGeodesicSphere } from './lib/geodesic';
import type { GemCutModule } from './index';

// Geodesic sphere — 20 triangular facets (detail=1)
const mod: GemCutModule = {
  name: 'zircon',
  build: () => buildGeodesicSphere(0),
};
export default mod;
