import { buildRegularPolyhedron } from "./lib/platonic";
import type { GemCutModule } from "./index";

// Tetrahedron — 4 faces, the sharpest and simplest cut.
const mod: GemCutModule = {
  name: "spinel",
  build: () => buildRegularPolyhedron(4),
};
export default mod;
