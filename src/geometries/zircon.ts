import { buildGeodesicSphere } from './lib/geodesic';
import type { GemCutModule } from './index';

// Geodesic sphere at detail 1 — 80 triangular facets, the roundest cut.
const mod: GemCutModule = {
  name: 'zircon',
  build: () => buildGeodesicSphere(1),
};
export default mod;
