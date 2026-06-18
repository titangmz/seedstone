/**
 * The gem use case's trait declaration — every visual and performance parameter
 * for the gem, expressed with the core engine's `constant` / `seeded` / `pick`.
 *
 *   constant(v)       fixed for every gem (slider bounds, if tunable in the
 *                     config lab, live in ./controls.ts — a presentation concern)
 *   seeded(min, max)  sampled uniformly per gem from [min, max)
 *   pick(options)     seed-picked from a list (e.g. the cut registry)
 *
 * Flip a value between fixed and seeded by editing its constructor here. Each
 * seeded value samples an independent hash of its dot-path and the seed, so
 * adding, removing, or pinning one never affects the others.
 *
 * Units, unless stated otherwise:
 *   hues                               degrees 0–360
 *   saturation / lightness / opacity   0–1
 *   distances / radii / positions      world units (the gem radius is ~0.65)
 *   rates                              radians or cycles per second
 */

import { constant, seeded, pick, type Config } from "../core/index";
import { listCuts } from "./geometries/index";

type Vec2 = [number, number];
type Vec3 = [number, number, number];
/** Which accent hue tints an orbit light, if any. */
type Tint = "accent1" | "accent2" | null;

export const gemTraits = {
  renderer: {
    toneMappingExposure: seeded(0.5, 1),
    // Half-res glass pass — a quarter of the pixels, no visible quality loss.
    transmissionResolutionScale: 0.5,
    defaultSize: 400, // fallback canvas size when container is unsized
    maxPixelRatio: 2, // cap; above 2 burns GPU for invisible gains
    maxFrameDelta: 0.1, // seconds; prevents jump after hidden tab
  },

  camera: {
    fov: constant(35),
    near: 0.1,
    far: 100,
    position: [0, 0.2, 2.4] as Vec3,
    lookAt: [0, -0.05, 0] as Vec3,
  },

  gem: {
    cut: pick(listCuts), // geometry, from the registry; pin with constant('garnet')
    hue: seeded(0, 360), // body colour; also tints the env fills and rim light
    saturation: seeded(0.55, 1),
    speed: seeded(0.6, 1.4), // rotation multiplier; also drives the orbit lights
    tilt: seeded(-0.2, 0.2), // Z-axis tilt, radians

    material: {
      ior: seeded(1.8, 2.8), // index of refraction
      iridescence: seeded(0.3, 1), // surface "fire" intensity
      transmission: constant(0.8), // 1 = fully glass-like
      thickness: constant(0.5), // refraction volume depth
      iridescenceIOR: constant(1.67),
      iridescenceThicknessRange: [100, 800] as Vec2, // nm; wider = more rainbow
      attenuationDistance: constant(2), // depth before tinting
      envMapIntensity: constant(3.1), // environment reflection strength
    },

    // Geometry imperfections, applied once when the mesh is built.
    distortion: {
      perfection: seeded(0, 1), // 0 = heavily distorted, 1 = flawless
      scaleX: seeded(0, 1), // per-axis stretch seeds
      scaleY: seeded(0, 1),
      scaleZ: seeded(0, 1),
      noiseSeed: seeded(0, 1), // vertex-noise direction seed
    },

    bodyLightness: constant(0.45),
    bodySaturationScale: constant(0.78), // tames fully-saturated hues
    attenuationLightness: constant(0.29), // depth-tint colour (darker = richer core)
    wireframeOpacity: constant(0.3), // facet-edge overlay; 0 disables it
    spinRate: constant(0.25), // base Y spin, multiplied by gem.speed
    wobbleRate: constant(1),
    wobbleAmount: constant(0.2),
  },

  // The PMREM-baked studio dome the gem reflects and refracts.
  // Tinted by lights.accent1Hue/accent2Hue (dome, spots) and gem.hue (fills).
  environment: {
    domeRadius: 6,
    domeSaturation: constant(0.1),
    domeLightness: constant(0.314), // near-black with a hint of accent hue
    // Bright spots — the "studio lights" glinting off facets (HDR values > 1).
    spotCount: constant(16),
    spotOrbitRadius: 5.5,
    spotSize: constant(0.07),
    whiteSpotIntensity: constant(2.5),
    tintSpotIntensity: constant(1.8),
    tintSpotLightness: constant(0.9),
    // Dim fill spheres tinting the lower hemisphere, hue-stepped from gem.hue.
    fillCount: constant(4),
    fillRadius: 4,
    fillSize: 0.8,
    fillSaturation: constant(0.6),
    fillLightness: constant(0.18),
    fillHueStep: 90,
    fillY: -1,
    blurRadius: constant(0), // PMREM blur sigma; 0 = sharp
  },

  lights: {
    accent1Hue: seeded(0, 360), // primary accent; tints lights + environment
    accent2HueOffset: constant(110), // second accent, degrees from the first
    ambientIntensity: constant(0.2),
    pointLightRange: constant(6), // falloff distance of the orbit lights
    // Four lights orbiting the gem. tint: accent1/accent2 take the accent hues;
    // null keeps the static color. phaseDeg spaces them; speed × gem.speed.
    orbits: [
      {
        color: 0xfff4e0,
        tint: null,
        intensity: 180,
        radius: 1.6,
        speed: 0.55,
        phaseDeg: 0,
        y: 1.0,
      },
      {
        color: 0xffffff,
        tint: "accent1" as Tint,
        intensity: 140,
        radius: 1.8,
        speed: -0.42,
        phaseDeg: 120,
        y: 0.3,
      },
      {
        color: 0xffffff,
        tint: "accent2" as Tint,
        intensity: 120,
        radius: 1.5,
        speed: 0.8,
        phaseDeg: 240,
        y: -0.2,
      },
      {
        color: 0xc8d8ff,
        tint: null,
        intensity: 80,
        radius: 2.0,
        speed: -0.3,
        phaseDeg: 180,
        y: 1.4,
      },
    ],
    tintSaturation: constant(1),
    tintLightness: seeded(0.1, 0.35),
    bobRate: constant(0.38), // vertical bobbing of orbit lights
    bobAmount: constant(0.35),
    rim: {
      intensity: constant(1.8),
      hueOffset: constant(160), // degrees from gem.hue
      saturation: constant(0.8),
      lightness: constant(0.55),
      position: [0.5, -1.5, -1.5] as Vec3,
    },
  },

  // The shell of tiny points floating around the gem.
  sparkles: {
    scatterSeed: seeded(0, 1), // placement seed — every gem gets its own sky
    count: constant(120),
    size: constant(0.025),
    radiusMin: constant(0.9),
    radiusRange: constant(1.4),
    driftRate: constant(-0.03), // slow counter-drift against gem spin
    baseOpacity: constant(0.45),
    pulseAmount: constant(0.15),
    pulseRate: constant(0.5),
  },
};

/** The raw gem trait tree — traits still wrapped, carrying kind/range metadata.
 *  Use to *inspect* the declaration (walk it, build a config UI). */
export type GemTraits = typeof gemTraits;

/** The fully-resolved gem config — every trait unwrapped to its plain value.
 *  This is what the renderer and scene work with after `derive(gemTraits, seed)`. */
export type GemConfig = Config<GemTraits>;
