import { buildRegularPolyhedron } from "./lib/platonic";
import type { GemCutModule } from "./index";

// Regular icosahedron — 20 triangular faces.
const mod: GemCutModule = {
  name: "tanzanite",
  build: () => buildRegularPolyhedron(20),
};
export default mod;
