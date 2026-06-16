import { describe, it, expect } from "vitest";
import { buildGeometry, listCuts } from "../dist/seedstone.esm.js";

const EXPECTED_CUTS = [
  "citrine",
  "fluorite",
  "garnet",
  "pyrite",
  "spinel",
  "tanzanite",
  "tourmaline",
  "zircon",
];

const EXPECTED_TRIANGLES = {
  citrine: 16,
  fluorite: 8,
  garnet: 36,
  pyrite: 12,
  spinel: 4,
  tanzanite: 20,
  tourmaline: 20,
  zircon: 80,
};

function triangleCount(geometry) {
  return geometry.getAttribute("position").count / 3;
}

describe("gem registry", () => {
  it("lists all cuts alphabetically", () => {
    expect(listCuts()).toEqual(EXPECTED_CUTS);
  });

  it("each cut produces the expected triangle count", () => {
    for (const cut of listCuts()) {
      expect(triangleCount(buildGeometry(cut)), cut).toBe(EXPECTED_TRIANGLES[cut]);
    }
  });

  it("each cut has a non-degenerate bounding box", () => {
    for (const cut of listCuts()) {
      const geo = buildGeometry(cut);
      geo.computeBoundingBox();
      const { min, max } = geo.boundingBox;
      expect(max.x - min.x, `${cut} x`).toBeGreaterThan(0);
      expect(max.y - min.y, `${cut} y`).toBeGreaterThan(0);
      expect(max.z - min.z, `${cut} z`).toBeGreaterThan(0);
    }
  });

  it("unknown cut falls back to a valid geometry", () => {
    expect(triangleCount(buildGeometry("not-a-real-cut"))).toBeGreaterThan(0);
  });
});
