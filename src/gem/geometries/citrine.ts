import { buildAntiprism } from "./lib/antiprism";
import type { GemCutModule } from "./index";

// Pentagonal antiprism — flat tablet silhouette, 16 triangular faces.
const mod: GemCutModule = {
  name: "citrine",
  build: () => buildAntiprism(5),
};
export default mod;
