import * as THREE from "three";
import { hslToHex } from "../core/index";

export interface OrbitConfig {
  color: number;
  tint: "accent1" | "accent2" | null;
  intensity: number;
  radius: number;
  speed: number;
  phaseDeg: number;
  y: number;
}

/** The slice of config a Lights rig needs. */
export interface LightsConfig {
  accent1Hue: number;
  accent2HueOffset: number;
  ambientIntensity: number;
  pointLightRange: number;
  orbits: OrbitConfig[];
  tintSaturation: number;
  tintLightness: number;
  bobRate: number;
  bobAmount: number;
  rim: {
    intensity: number;
    hueOffset: number;
    saturation: number;
    lightness: number;
    position: [number, number, number];
  };
}

/** Cross-cutting inputs the rig takes from the rest of the scene, kept explicit
 *  so Lights stays decoupled from any particular use case's config shape. */
export interface LightsInputs {
  /** Body hue the rim light is offset from. */
  bodyHue: number;
  /** Global motion multiplier applied to orbit speeds. */
  motionSpeed: number;
}

interface OrbitingLight {
  light: THREE.PointLight;
  cfg: OrbitConfig;
  phase: number; // radians, from cfg.phaseDeg
  speed: number; // cfg.speed * motionSpeed
}

/**
 * A light rig: point lights orbiting the centre (two tinted with the accent
 * hues), a rim light from below offset from the body hue, and a faint ambient.
 *
 * All properties are patched in place on update — the orbit count is fixed by
 * the config, so the light objects never need rebuilding.
 */
export class Lights {
  private cfg: LightsConfig;
  private ambient: THREE.AmbientLight;
  private orbits: OrbitingLight[];
  private rim: THREE.DirectionalLight;

  constructor(scene: THREE.Scene, cfg: LightsConfig, inputs: LightsInputs) {
    this.cfg = cfg;

    this.ambient = new THREE.AmbientLight(0xffffff, cfg.ambientIntensity);
    scene.add(this.ambient);

    this.orbits = cfg.orbits.map((orbitCfg) => {
      const light = new THREE.PointLight();
      light.position.set(orbitCfg.radius, orbitCfg.y, 0);
      scene.add(light);
      return {
        light,
        cfg: orbitCfg,
        phase: (orbitCfg.phaseDeg / 180) * Math.PI,
        speed: orbitCfg.speed * inputs.motionSpeed,
      };
    });

    this.rim = new THREE.DirectionalLight();
    scene.add(this.rim);

    this._apply(cfg, inputs);
  }

  /** Patch every light's colour/intensity/range from the config, in place. */
  private _apply(cfg: LightsConfig, inputs: LightsInputs): void {
    this.cfg = cfg;

    this.ambient.intensity = cfg.ambientIntensity;

    const accent1Hue = cfg.accent1Hue;
    const accent2Hue = (accent1Hue + cfg.accent2HueOffset) % 360;

    for (const orbit of this.orbits) {
      const hue =
        orbit.cfg.tint === "accent1"
          ? accent1Hue
          : orbit.cfg.tint === "accent2"
            ? accent2Hue
            : null;
      const color =
        hue !== null ? hslToHex(hue, cfg.tintSaturation, cfg.tintLightness) : orbit.cfg.color;
      orbit.light.color.set(color);
      orbit.light.intensity = orbit.cfg.intensity;
      orbit.light.distance = cfg.pointLightRange;
      orbit.speed = orbit.cfg.speed * inputs.motionSpeed;
    }

    this.rim.color.set(
      hslToHex((inputs.bodyHue + cfg.rim.hueOffset) % 360, cfg.rim.saturation, cfg.rim.lightness),
    );
    this.rim.intensity = cfg.rim.intensity;
    this.rim.position.set(...cfg.rim.position);
  }

  update(cfg: LightsConfig, inputs: LightsInputs): void {
    this._apply(cfg, inputs);
  }

  animate(t: number): void {
    for (const { light, cfg, phase, speed } of this.orbits) {
      light.position.set(
        cfg.radius * Math.cos(t * speed + phase),
        cfg.y + Math.sin(t * this.cfg.bobRate + phase) * this.cfg.bobAmount,
        cfg.radius * Math.sin(t * speed + phase),
      );
    }
  }

  dispose(): void {
    for (const { light } of this.orbits) {
      light.removeFromParent();
      light.dispose();
    }
    this.ambient.removeFromParent();
    this.ambient.dispose();
    this.rim.removeFromParent();
    this.rim.dispose();
    this.orbits.length = 0;
  }
}
