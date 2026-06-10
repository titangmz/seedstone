import * as THREE from 'three';
import { listCuts } from './geometries/index';
import { stringToDNA, GemDNA } from './dna';
import { mergeConfig, SeedstoneConfig, SeedstoneConfigOverrides } from './config';
import { Environment } from './scene/environment';
import { Gem, buildGemGeometry } from './scene/gem';
import { Lights } from './scene/lights';
import { Sparkles } from './scene/sparkles';

// ── Public API types ──────────────────────────────────────────────────────────

export interface SeedstoneOptions {
  /** Element the canvas is appended to. Required. */
  container:    HTMLElement;
  /** Canvas size in px. Defaults to the container's client size. */
  width?:       number;
  height?:      number;
  /** Background colour, or null (default) for a transparent canvas. */
  background?:  string | number | null;
  /** Start the render loop immediately. If false, a single still frame is rendered. Default: true. */
  autoRotate?:  boolean;
  /** Canvas pixel ratio. Default: min(devicePixelRatio, 2). */
  pixelRatio?:  number;
  /** Cap the render loop frame rate. Useful for gallery thumbnails (e.g. 24). */
  targetFPS?:   number;
  /** Force individual DNA traits, e.g. `{ cut: 'garnet' }`. */
  overrides?:   Partial<GemDNA>;
  /** Per-instance tuning overrides, deep-merged over the config.ts defaults. */
  config?:      SeedstoneConfigOverrides;
  /** Keep the drawing buffer readable for canvas.toDataURL(). Costs performance. Default: false. */
  preserveDrawingBuffer?: boolean;
}

/** Resolve seed + overrides into final DNA, discarding any unknown cut name. */
function resolveDNA(seed: string, overrides: Partial<GemDNA>): GemDNA {
  const cuts   = listCuts();
  const base   = stringToDNA(seed, cuts);
  const merged = { ...base, ...overrides };
  return { ...merged, cut: cuts.includes(merged.cut) ? merged.cut : base.cut };
}

// ── Renderer ──────────────────────────────────────────────────────────────────

/**
 * Owns the WebGL context, camera, and render loop, and orchestrates the four
 * scene modules (environment, gem, lights, sparkles). All DNA-dependent state
 * lives in those modules; this class only schedules work.
 */
export class SeedstoneRenderer {
  private config:      SeedstoneConfig;
  private renderer:    THREE.WebGLRenderer;
  private scene:       THREE.Scene;
  private camera:      THREE.PerspectiveCamera;
  private environment!: Environment;
  private gem!:         Gem;
  private lights!:      Lights;
  private sparkles!:    Sparkles;

  private minFrameMs:  number;       // minimum ms between renders (FPS cap)
  private lastTick     = 0;          // rAF timestamp of the last rendered frame
  private elapsed      = 0;          // accumulated animation time in seconds
  private pendingGeo:  THREE.BufferGeometry | null = null; // built off-frame, swapped before next render
  private updateSeq    = 0;          // monotone counter — stale idle callbacks bail out early
  private animFrameId: number | null = null;
  private destroyed    = false;

  /** The resolved DNA currently being rendered. Read-only. */
  dna: GemDNA;

  constructor(seed: string, options: SeedstoneOptions) {
    this.config = mergeConfig(options.config);
    this.dna    = resolveDNA(seed, options.overrides ?? {});

    const container = options.container;
    if (!container) throw new Error('[seedstone] options.container is required.');

    const { renderer: rendererCfg, camera: cameraCfg } = this.config;
    const width     = options.width  ?? (container.clientWidth  || rendererCfg.defaultSize);
    const height    = options.height ?? (container.clientHeight || rendererCfg.defaultSize);
    const bg        = options.background ?? null;
    this.minFrameMs = options.targetFPS ? (1000 / options.targetFPS) : 0;

    this.renderer = new THREE.WebGLRenderer({
      antialias:             true,
      alpha:                 bg === null,
      powerPreference:       'high-performance',
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    this.renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, rendererCfg.maxPixelRatio));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping              = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled        = false;
    // Skip synchronous shader-error readback — a known compile-time stall.
    this.renderer.debug.checkShaderErrors  = false;
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    if (bg !== null) this.scene.background = new THREE.Color(bg);

    this.camera = new THREE.PerspectiveCamera(cameraCfg.fov, width / height, cameraCfg.near, cameraCfg.far);

    this._applyRendererConfig();
    this._buildScene();

    if (options.autoRotate !== false) this._startLoop();
    else this._renderFrame();
  }

  // ── Scene lifecycle ───────────────────────────────────────────────────────

  /** Renderer/camera knobs that can be (re)applied without a rebuild. */
  private _applyRendererConfig(): void {
    const { renderer: rendererCfg, camera: cameraCfg } = this.config;
    this.renderer.toneMappingExposure         = rendererCfg.toneMappingExposure;
    this.renderer.transmissionResolutionScale = rendererCfg.transmissionResolutionScale;
    this.camera.fov  = cameraCfg.fov;
    this.camera.near = cameraCfg.near;
    this.camera.far  = cameraCfg.far;
    this.camera.position.set(...cameraCfg.position);
    this.camera.lookAt(...cameraCfg.lookAt);
    this.camera.updateProjectionMatrix();
  }

  private _buildScene(): void {
    this.environment = new Environment(this.renderer, this.config.environment);
    this.environment.applyDNA(this.dna);
    this.scene.environment = this.environment.render();

    this.gem      = new Gem(this.scene, this.dna, this.config.gem);
    this.lights   = new Lights(this.scene, this.config.lights);
    this.sparkles = new Sparkles(this.scene, this.dna, this.config.sparkles);
    this.lights.applyDNA(this.dna);
  }

  private _disposeScene(): void {
    this.pendingGeo?.dispose();
    this.pendingGeo = null;
    this.gem.dispose();
    this.lights.dispose();
    this.sparkles.dispose();
    this.environment.dispose();
  }

  // ── Render loop ───────────────────────────────────────────────────────────

  /** Render one frame at the current animation time. */
  private _renderFrame(): void {
    if (this.pendingGeo) {
      this.gem.setGeometry(this.pendingGeo);
      this.pendingGeo = null;
    }
    this.gem.animate(this.elapsed, this.dna);
    // this.lights.animate(this.elapsed);
    this.sparkles.animate(this.elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  private _startLoop(): void {
    const tick = (now: number) => {
      if (this.destroyed) return;
      this.animFrameId = requestAnimationFrame(tick);

      // FPS cap: skip the frame if not enough time has passed
      if (this.minFrameMs > 0 && now - this.lastTick < this.minFrameMs) return;

      // Clamp the time step so the animation doesn't jump after a hidden tab.
      const dt = this.lastTick === 0 ? 0
        : Math.min((now - this.lastTick) / 1000, this.config.renderer.maxFrameDelta);
      this.lastTick = now;
      this.elapsed += dt;
      this._renderFrame();
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Swap to a new seed without touching the WebGL context.
   * Material, light, and sparkle values update in-place; the geometry build
   * and environment re-bake run in idle time, off the render path — no scene
   * graph mutations, no shader recompilation.
   */
  update(seed: string, overrides: Partial<GemDNA> = {}): void {
    if (this.destroyed) return;

    this.dna = resolveDNA(seed, overrides);
    this.gem.applyDNA(this.dna);
    this.lights.applyDNA(this.dna);
    this.sparkles.applyDNA(this.dna);
    this.environment.applyDNA(this.dna);

    // buildGemGeometry is synchronous CPU work (~5 ms) and the env re-bake is
    // a small GPU pass. Inside a rAF callback they would stack on top of
    // renderer.render() and blow the frame budget, so both run in idle time;
    // the result is picked up by the next rendered frame.
    const seq = ++this.updateSeq;
    const rebuild = () => {
      if (this.destroyed || seq !== this.updateSeq) return;
      this.pendingGeo?.dispose();   // discard any previously-queued unrendered geo
      this.pendingGeo = buildGemGeometry(this.dna);
      this.scene.environment = this.environment.render();
      if (this.animFrameId === null) this._renderFrame();   // paused → show the result now
    };
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(rebuild, { timeout: 150 });
    } else {
      setTimeout(rebuild, 0);
    }
  }

  /**
   * Re-apply tuning overrides on a live instance, replacing any previous ones.
   * The scene modules are rebuilt on the existing WebGL context — a few ms of
   * work, intended for theming and interactive tuning rather than per-frame use.
   */
  setConfig(overrides: SeedstoneConfigOverrides = {}): void {
    if (this.destroyed) return;
    this.config = mergeConfig(overrides);
    this.updateSeq++;             // cancel any in-flight idle rebuild
    this._applyRendererConfig();
    this._disposeScene();
    this._buildScene();
    if (this.animFrameId === null) this._renderFrame();
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.animFrameId === null && !this.destroyed) this._renderFrame();
  }

  pause(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
      this.lastTick = 0;   // next play() resumes smoothly instead of jumping
    }
  }

  play(): void {
    if (this.animFrameId === null && !this.destroyed) this._startLoop();
  }

  destroy(): void {
    this.destroyed = true;
    this.pause();
    this._disposeScene();
    this.renderer.forceContextLoss();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
