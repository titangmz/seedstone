/**
 * Config-lab slider bounds for the gem's `constant` traits — a *presentation*
 * concern, deliberately kept out of the derivation engine (a constant only needs
 * its value to resolve). Keyed by trait dot-path.
 *
 * A constant knob with an entry here renders as a slider in the config lab, and
 * the same bounds become its sampling range if the user flips it to seed-driven.
 * A constant with no entry renders as a plain value input. `seeded` traits carry
 * their own range, so they never need an entry.
 */

export interface ControlBounds {
  min: number;
  max: number;
  step: number;
}

export const controls: Record<string, ControlBounds> = {
  "camera.fov": { min: 10, max: 80, step: 1 },

  "gem.material.transmission": { min: 0, max: 1, step: 0.01 },
  "gem.material.thickness": { min: 0, max: 3, step: 0.05 },
  "gem.material.iridescenceIOR": { min: 1, max: 2.33, step: 0.01 },
  "gem.material.attenuationDistance": { min: 0.1, max: 8, step: 0.1 },
  "gem.material.envMapIntensity": { min: 0, max: 12, step: 0.1 },
  "gem.bodyLightness": { min: 0, max: 1, step: 0.01 },
  "gem.bodySaturationScale": { min: 0, max: 1, step: 0.01 },
  "gem.attenuationLightness": { min: 0, max: 1, step: 0.01 },
  "gem.wireframeOpacity": { min: 0, max: 0.3, step: 0.005 },
  "gem.spinRate": { min: 0, max: 2, step: 0.05 },
  "gem.wobbleRate": { min: 0, max: 2, step: 0.05 },
  "gem.wobbleAmount": { min: 0, max: 0.5, step: 0.01 },

  "environment.domeSaturation": { min: 0, max: 1, step: 0.01 },
  "environment.domeLightness": { min: 0, max: 0.5, step: 0.005 },
  "environment.spotCount": { min: 0, max: 48, step: 1 },
  "environment.spotSize": { min: 0.01, max: 0.3, step: 0.005 },
  "environment.whiteSpotIntensity": { min: 0, max: 15, step: 0.1 },
  "environment.tintSpotIntensity": { min: 0, max: 10, step: 0.1 },
  "environment.tintSpotLightness": { min: 0, max: 1, step: 0.01 },
  "environment.fillCount": { min: 0, max: 8, step: 1 },
  "environment.fillSaturation": { min: 0, max: 1, step: 0.01 },
  "environment.fillLightness": { min: 0, max: 0.6, step: 0.01 },
  "environment.blurRadius": { min: 0, max: 1, step: 0.02 },

  "lights.accent2HueOffset": { min: 0, max: 360, step: 5 },
  "lights.ambientIntensity": { min: 0, max: 0.5, step: 0.01 },
  "lights.pointLightRange": { min: 0, max: 12, step: 0.5 },
  "lights.tintSaturation": { min: 0, max: 1, step: 0.01 },
  "lights.bobRate": { min: 0, max: 2, step: 0.02 },
  "lights.bobAmount": { min: 0, max: 1, step: 0.02 },
  "lights.rim.intensity": { min: 0, max: 6, step: 0.1 },
  "lights.rim.hueOffset": { min: 0, max: 360, step: 5 },
  "lights.rim.saturation": { min: 0, max: 1, step: 0.01 },
  "lights.rim.lightness": { min: 0, max: 1, step: 0.01 },

  "sparkles.count": { min: 0, max: 500, step: 10 },
  "sparkles.size": { min: 0, max: 0.1, step: 0.001 },
  "sparkles.radiusMin": { min: 0.3, max: 2, step: 0.05 },
  "sparkles.radiusRange": { min: 0, max: 3, step: 0.05 },
  "sparkles.driftRate": { min: -0.3, max: 0.3, step: 0.01 },
  "sparkles.baseOpacity": { min: 0, max: 1, step: 0.02 },
  "sparkles.pulseAmount": { min: 0, max: 0.5, step: 0.01 },
  "sparkles.pulseRate": { min: 0, max: 3, step: 0.05 },
};
