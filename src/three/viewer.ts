import * as THREE from "three";
import { merge, derive, type Override, type Traits } from "../core/index";
import type { SceneFactory, Scene, SceneContext, ViewerConfig } from "./contract";

// ── Public API types ──────────────────────────────────────────────────────────

export interface ViewerOptions {
  /** Element the canvas is appended to. Required. */
  container: HTMLElement;
  /** Canvas size in px. Defaults to the container's client size. */
  width?: number;
  height?: number;
  /** Background colour, or null (default) for a transparent canvas. */
  background?: string | number | null;
  /** Start the render loop immediately. If false, a single still frame is rendered. Default: true. */
  autoRotate?: boolean;
  /** Canvas pixel ratio. Default: min(devicePixelRatio, 2). */
  pixelRatio?: number;
  /** Cap the render loop frame rate. Useful for gallery thumbnails (e.g. 24). */
  targetFPS?: number;
  /** Pin or seed any trait for this instance, e.g. `{ gem: { cut: 'garnet', hue: 200 } }`. */
  config?: Override<Traits>;
  /** Keep the drawing buffer readable for canvas.toDataURL(). Costs performance. Default: false. */
  preserveDrawingBuffer?: boolean;
  /** Called once the shaders are compiled and the first frame is painted —
   *  useful for hiding a loading state. The scene appears stutter-free. */
  onReady?: () => void;
}

// ── Viewer ──────────────────────────────────────────────────────────────────

/**
 * The generic 3D toolkit core: owns the WebGL context, camera, and render loop,
 * and drives a use case's `Scene` (built by its `SceneFactory`). Changing seed
 * or config reconciles the scene in place (off the render path) on the same
 * WebGL context. Knows nothing about the gem — the gem is just one `SceneFactory`.
 */
export class Viewer<C extends ViewerConfig = ViewerConfig> {
  private factory: SceneFactory<C>;
  private traits: Traits; // trait tree with instance overrides applied
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private content!: Scene<C>; // the use case's mounted scene

  private minFrameMs: number; // minimum ms between renders (FPS cap)
  private onReady?: () => void; // fired after the first stutter-free paint
  private lastTick = 0; // rAF timestamp of the last rendered frame
  private elapsed = 0; // accumulated animation time in seconds
  private rebuildSeq = 0; // monotone counter — stale idle rebuilds bail out early
  private animFrameId: number | null = null;
  private destroyed = false;

  /** The seed currently being rendered. Read-only. */
  seed: string;
  /** The resolved per-seed config currently being rendered. Read-only. */
  config: C;

  constructor(seed: string, factory: SceneFactory<C>, options: ViewerOptions) {
    this.factory = factory;
    this.traits = merge(factory.traits, options.config);
    this.seed = seed;
    this.config = derive(this.traits, seed) as C;

    const container = options.container;
    if (!container) throw new Error("[seedstone] options.container is required.");

    const { renderer: rendererCfg } = this.config;
    const width = options.width ?? (container.clientWidth || rendererCfg.defaultSize);
    const height = options.height ?? (container.clientHeight || rendererCfg.defaultSize);
    const bg = options.background ?? null;
    this.minFrameMs = options.targetFPS ? 1000 / options.targetFPS : 0;
    this.onReady = options.onReady;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: bg === null,
      powerPreference: "high-performance",
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    this.renderer.setPixelRatio(
      options.pixelRatio ?? Math.min(window.devicePixelRatio, rendererCfg.maxPixelRatio),
    );
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = false;
    // Skip synchronous shader-error readback — a known compile-time stall.
    this.renderer.debug.checkShaderErrors = false;
    this.renderer.domElement.style.display = "block";
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    if (bg !== null) this.scene.background = new THREE.Color(bg);

    const cameraCfg = this.config.camera;
    this.camera = new THREE.PerspectiveCamera(
      cameraCfg.fov,
      width / height,
      cameraCfg.near,
      cameraCfg.far,
    );

    this._applyRendererConfig();
    this.content = factory.createScene(this.config, this._context());
    this._start(options.autoRotate !== false);
  }

  private _context(): SceneContext {
    return { scene: this.scene, camera: this.camera, renderer: this.renderer };
  }

  /**
   * Pre-compile the scene's shaders off the main thread, then paint the first
   * frame and start the loop. A heavy transmission/iridescence program stalls
   * for a few hundred ms if compiled lazily on the first render, so we wait for
   * `compileAsync` (non-blocking where the parallel-compile extension exists)
   * before showing anything. `.then(start, start)` runs the start path even if
   * the compile rejects — degrading to a lazy compile rather than never rendering.
   */
  private _start(autoRotate: boolean): void {
    const start = () => {
      if (this.destroyed) return;
      this._renderFrame(); // first paint — shaders warm, no stall
      this.onReady?.();
      if (autoRotate) this._startLoop();
    };
    this.renderer.compileAsync(this.scene, this.camera).then(start, start);
  }

  // ── Scene lifecycle ───────────────────────────────────────────────────────

  /** Renderer/camera knobs that apply outside the use case's scene. */
  private _applyRendererConfig(): void {
    const { renderer: rendererCfg, camera: cameraCfg } = this.config;
    this.renderer.toneMappingExposure = rendererCfg.toneMappingExposure;
    this.renderer.transmissionResolutionScale = rendererCfg.transmissionResolutionScale;
    this.camera.fov = cameraCfg.fov;
    this.camera.near = cameraCfg.near;
    this.camera.far = cameraCfg.far;
    this.camera.position.set(...cameraCfg.position);
    this.camera.lookAt(...cameraCfg.lookAt);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Reconcile the scene to the current config, in place on the existing WebGL
   * context. Runs in idle time, off the render path, and coalesces bursts (rapid
   * typing) via `rebuildSeq` so only the latest config is applied.
   */
  private _scheduleApply(): void {
    const seq = ++this.rebuildSeq;
    const apply = () => {
      if (this.destroyed || seq !== this.rebuildSeq) return;
      this._applyRendererConfig();
      this.content.update(this.config);
      if (this.animFrameId === null) this._renderFrame(); // paused → show the result now
    };
    setTimeout(apply, 0);
  }

  // ── Render loop ───────────────────────────────────────────────────────────

  /** Render one frame at the current animation time. */
  private _renderFrame(): void {
    this.content.animate(this.elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  private _startLoop(): void {
    const tick = (now: number) => {
      if (this.destroyed) return;
      this.animFrameId = requestAnimationFrame(tick);

      // FPS cap: skip the frame if not enough time has passed
      if (this.minFrameMs > 0 && now - this.lastTick < this.minFrameMs) return;

      // Clamp the time step so the animation doesn't jump after a hidden tab.
      const dt =
        this.lastTick === 0
          ? 0
          : Math.min((now - this.lastTick) / 1000, this.config.renderer.maxFrameDelta);
      this.lastTick = now;
      this.elapsed += dt;
      this._renderFrame();
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Swap to a new seed without touching the WebGL context. `seed` and `config`
   * update immediately; the scene rebuild runs in idle time and shows up within
   * a frame or two.
   */
  update(seed: string): void {
    if (this.destroyed) return;
    this.seed = seed;
    this.config = derive(this.traits, seed) as C;
    this._scheduleApply();
  }

  /**
   * Re-apply config overrides on a live instance, replacing any previous ones.
   * Intended for theming and interactive tuning, not per-frame use.
   */
  setConfig(overrides: Override<Traits> = {}): void {
    if (this.destroyed) return;
    this.traits = merge(this.factory.traits, overrides);
    this.config = derive(this.traits, this.seed) as C;
    this._scheduleApply();
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
      this.lastTick = 0; // next play() resumes smoothly instead of jumping
    }
  }

  play(): void {
    if (this.animFrameId === null && !this.destroyed) this._startLoop();
  }

  destroy(): void {
    this.destroyed = true;
    this.pause();
    this.renderer.domElement.remove();
    this.content.dispose();
    this.renderer.dispose();
    // Chrome paints a brief white frame when a WebGL context is force-lost.
    // Defer the loss to the next frame — by then the detached canvas's
    // compositor layer is gone, so that white frame is never visible. (The
    // context is freed either way; this just controls *when*.)
    const renderer = this.renderer;
    requestAnimationFrame(() => renderer.forceContextLoss());
  }
}
