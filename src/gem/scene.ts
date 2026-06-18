import {
  Lights,
  Environment,
  Sparkles,
  type SceneFactory,
  type Scene,
  type SceneContext,
  type LightsConfig,
  type LightsInputs,
  type EnvironmentConfig,
  type EnvironmentInputs,
  type SparklesConfig,
} from "../three/index";
import * as THREE from "three";
import { GemMesh } from "./mesh";
import { gemTraits, type GemConfig } from "./traits";

/** Cross-inputs the light rig takes from the gem body. */
function lightsInputs(config: GemConfig): LightsInputs {
  return { bodyHue: config.gem.hue, motionSpeed: config.gem.speed };
}

/** Cross-inputs the environment dome takes from the lights + gem body. */
function envInputs(config: GemConfig): EnvironmentInputs {
  return {
    accent1Hue: config.lights.accent1Hue,
    accent2Hue: (config.lights.accent1Hue + config.lights.accent2HueOffset) % 360,
    fillBaseHue: config.gem.hue,
  };
}

/**
 * The gem as a `Scene`: the gemstone mesh plus the reusable toolkit blocks
 * (environment, lights, sparkles), wired together. The toolkit blocks take their
 * own config slice plus the gem's body hue/speed as explicit cross-inputs, so
 * the coupling lives here in the use case rather than inside the toolkit.
 *
 * Reconciliation mirrors the previous renderer exactly: only the gem mesh and
 * sparkles advance per frame; the orbit lights and environment are static
 * between config changes.
 */
class GemScene implements Scene<GemConfig> {
  private scene: THREE.Scene;
  private environment: Environment;
  private gem: GemMesh;
  private lights: Lights;
  private sparkles: Sparkles;

  constructor(config: GemConfig, ctx: SceneContext) {
    this.scene = ctx.scene;

    this.environment = new Environment(
      ctx.renderer,
      config.environment as EnvironmentConfig,
      envInputs(config),
    );
    this.scene.environment = this.environment.render();
    this.gem = new GemMesh(ctx.scene, config.gem);
    this.lights = new Lights(ctx.scene, config.lights as LightsConfig, lightsInputs(config));
    this.sparkles = new Sparkles(ctx.scene, config.sparkles as SparklesConfig);
  }

  update(config: GemConfig): void {
    this.scene.environment = this.environment.update(
      config.environment as EnvironmentConfig,
      envInputs(config),
    );
    this.gem.update(config.gem);
    this.lights.update(config.lights as LightsConfig, lightsInputs(config));
    this.sparkles.update(config.sparkles as SparklesConfig);
  }

  animate(t: number): void {
    this.gem.animate(t);
    this.sparkles.animate(t);
  }

  dispose(): void {
    this.gem.dispose();
    this.lights.dispose();
    this.sparkles.dispose();
    this.environment.dispose();
  }
}

/** The gem use case, ready to drive a `Viewer`. */
export const gemSceneFactory: SceneFactory<GemConfig> = {
  traits: gemTraits,
  createScene: (config, ctx) => new GemScene(config, ctx),
};
