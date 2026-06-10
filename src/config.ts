/**
 * Central tuning file — every visual and performance knob for the renderer
 * and scene lives here. Edit and rebuild; values are baked into the bundle.
 *
 * Types are inferred from the values, so there is no schema to keep in sync.
 *
 * Units, unless stated otherwise:
 *   hues                               degrees 0–360
 *   saturation / lightness / opacity   0–1
 *   distances / radii / positions      world units (the gem radius is ~0.65)
 *   rates                              radians or cycles per second
 */

type Vec2 = [number, number];
type Vec3 = [number, number, number];
/** Which DNA accent hue tints an orbit light, if any. */
type Tint = 'light1' | 'light2' | null;

export const config = {
  renderer: {
    // ACES filmic tone-mapping exposure. Lower = darker, moodier.
    toneMappingExposure: 0.6,
    // The transmission (glass) pass re-renders the scene offscreen. 0.5 renders
    // it at half resolution — a quarter of the pixels, no visible quality loss.
    transmissionResolutionScale: 0.5,
    // Fallback canvas size in px when the container has no measurable size.
    defaultSize: 400,
    // devicePixelRatio cap; above 2 burns GPU for invisible gains.
    maxPixelRatio: 2,
    // Per-frame time-step clamp in seconds, so the animation doesn't jump
    // forward after the tab was hidden or the renderer was paused.
    maxFrameDelta: 0.1,
  },

  camera: {
    fov:      35,
    near:     0.1,
    far:      100,
    position: [0, 0.2, 2.4] as Vec3,
    lookAt:   [0, -0.05, 0] as Vec3,
  },

  gem: {
    material: {
      transmission:              0.88,  // 1 = fully glass-like
      thickness:                 0.4,   // refraction volume depth
      reflectivity:              0.4,
      iridescenceIOR:            1.2,
      iridescenceThicknessRange: [100, 800] as Vec2,  // nm; wider = more rainbow spread
      attenuationDistance:       1.4,   // how deep light travels before tinting
      envMapIntensity:           3.1,   // strength of environment reflections
    },
    // DNA → colour mapping
    bodyLightness:        0.45,
    bodySaturationScale:  0.9,  // tames fully-saturated DNA hues
    attenuationLightness: 0.2,  // depth-tint colour (darker = richer core)
    // Faint facet-edge overlay; 0 disables the wireframe pass entirely.
    wireframeOpacity: 0.06,
    // Idle motion
    spinRate:     0.4,   // base Y spin, multiplied by dna.speed
    wobbleRate:   0.3,
    wobbleAmount: 0.12,
  },

  // The PMREM-baked studio dome the gem reflects and refracts.
  environment: {
    domeRadius:     6,
    domeSaturation: 0.4,
    domeLightness:  0.05,  // near-black backdrop with a hint of accent hue
    // Bright spots — the "studio lights" glinting off facets. RGB values above
    // 1 read as HDR highlights after the PMREM bake.
    spotCount:          16,
    spotOrbitRadius:    5.5,
    spotSize:           0.07,
    whiteSpotIntensity: 2.5,
    tintSpotIntensity:  1.8,
    tintSpotLightness:  0.9,
    // Dim fill spheres tinting the lower hemisphere, hue-stepped from the DNA.
    fillCount:      4,
    fillRadius:     4,
    fillSize:       0.8,
    fillSaturation: 0.6,
    fillLightness:  0.18,
    fillHueStep:    90,
    fillY:          -1,
    blurRadius:     0,  // PMREM blur sigma; 0 = sharp reflections
  },

  lights: {
    ambientIntensity: 0.05,
    pointLightRange:  6,  // falloff distance of the orbit lights
    // Four lights orbiting the gem. tint: light1/light2 take the DNA's accent
    // hues; null keeps the static color. phaseDeg spaces them around the
    // orbit; speed is multiplied by dna.speed (negative = counter-clockwise).
    orbits: [
      { color: 0xfff4e0, tint: null,            intensity: 180, radius: 1.6, speed:  0.55, phaseDeg: 0,   y:  1.0 },
      { color: 0xffffff, tint: 'light1' as Tint, intensity: 140, radius: 1.8, speed: -0.42, phaseDeg: 120, y:  0.3 },
      { color: 0xffffff, tint: 'light2' as Tint, intensity: 120, radius: 1.5, speed:  0.80, phaseDeg: 240, y: -0.2 },
      { color: 0xc8d8ff, tint: null,            intensity:  80, radius: 2.0, speed: -0.30, phaseDeg: 180, y:  1.4 },
    ],
    tintSaturation: 0.29,
    tintLightness:  0.65,
    // Vertical bobbing of the orbit lights
    bobRate:   0.38,
    bobAmount: 0.35,
    // Rim light from below, complementary to the gem's hue
    rim: {
      intensity:  1.8,
      hueOffset:  160,  // degrees from the gem's body hue
      saturation: 0.8,
      lightness:  0.55,
      position:   [0.5, -1.5, -1.5] as Vec3,
    },
  },

  // The shell of tiny points floating around the gem.
  sparkles: {
    count:       120,
    size:        0.025,
    radiusMin:   0.9,
    radiusRange: 1.4,
    driftRate:   -0.03,  // slow counter-drift against the gem's spin
    baseOpacity: 0.45,
    pulseAmount: 0.15,
    pulseRate:   0.5,
  },
};

// ── Per-instance overrides ────────────────────────────────────────────────────

export type SeedstoneConfig = typeof config;

/** Recursive partial of the config. Arrays are replaced wholesale, not merged. */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[] ? T[K]
    : T[K] extends object ? DeepPartial<T[K]>
    : T[K];
};

export type SeedstoneConfigOverrides = DeepPartial<SeedstoneConfig>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends object>(base: T, patch: Record<string, unknown>): T {
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    merged[key] = isPlainObject(baseValue) && isPlainObject(value)
      ? deepMerge(baseValue, value)
      : value;
  }
  return merged as T;
}

/** The default config deep-merged with per-instance overrides. */
export function mergeConfig(overrides: SeedstoneConfigOverrides = {}): SeedstoneConfig {
  return deepMerge(config, overrides as Record<string, unknown>);
}
