import * as THREE from 'three';
import { hslToHex } from './color';
import type { SeedstoneConfig } from '../config';
import type { GemDNA } from '../dna';

type LightsConfig = SeedstoneConfig['lights'];
type OrbitConfig  = LightsConfig['orbits'][number];

interface OrbitingLight {
  light: THREE.PointLight;
  cfg:   OrbitConfig;
  phase: number;   // radians, from cfg.phaseDeg
  speed: number;   // cfg.speed * dna.speed
}

/**
 * The light rig: point lights orbiting the gem (two tinted by the DNA's
 * accent hues), a complementary rim light from below, and a faint ambient.
 */
export class Lights {
  private cfg:     LightsConfig;
  private ambient: THREE.AmbientLight;
  private orbits:  OrbitingLight[];
  private rim:     THREE.DirectionalLight;

  constructor(scene: THREE.Scene, cfg: LightsConfig) {
    this.cfg = cfg;

    this.ambient = new THREE.AmbientLight(0xffffff, cfg.ambientIntensity);
    scene.add(this.ambient);

    this.orbits = cfg.orbits.map(orbitCfg => {
      const light = new THREE.PointLight(orbitCfg.color, orbitCfg.intensity, cfg.pointLightRange);
      light.position.set(orbitCfg.radius, orbitCfg.y, 0);
      scene.add(light);
      return { light, cfg: orbitCfg, phase: (orbitCfg.phaseDeg / 180) * Math.PI, speed: orbitCfg.speed };
    });

    this.rim = new THREE.DirectionalLight(0xffffff, cfg.rim.intensity);
    this.rim.position.set(...cfg.rim.position);
    scene.add(this.rim);
  }

  applyDNA(dna: GemDNA): void {
    for (const orbit of this.orbits) {
      const hue = orbit.cfg.tint === 'light1' ? dna.light1Hue
                : orbit.cfg.tint === 'light2' ? dna.light2Hue
                : null;
      if (hue !== null) {
        orbit.light.color.setHex(hslToHex(hue, this.cfg.tintSaturation, this.cfg.tintLightness));
      }
      orbit.speed = orbit.cfg.speed * dna.speed;
    }
    this.rim.color.setHex(hslToHex(
      (dna.hue + this.cfg.rim.hueOffset) % 360, this.cfg.rim.saturation, this.cfg.rim.lightness,
    ));
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
