import { buildRegularPolyhedron } from "./lib/platonic";
import type { GemCutModule } from "./index";

// Fluorite cleaves into octahedra — 8 triangular faces.
const mod: GemCutModule = {
  name: "fluorite",
  build: () => buildRegularPolyhedron(8),
};
export default mod;
