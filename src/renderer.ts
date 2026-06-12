import * as THREE from 'three';
import { buildGeometry, listCuts } from './geometries/index';
import { applyDistortions } from './geometries/lib/distort';
import { stringToDNA, GemDNA } from './hash';

// ── Renderer constants ────────────────────────────────────────────────────────

const TONE_MAPPING_EXPOSURE = 0.85;
const ENV_POINT_COUNT       = 16;
const ENV_FILL_COUNT        = 4;
const ENV_BLUR_RADIUS       = 0;
const ENV_FILL_RADIUS       = 4;
const GEM_TRANSMISSION      = 0.92;
const GEM_THICKNESS         = 0.7;
const GEM_IRIDESCENCE_RANGE: [number, number] = [100, 800];
const GEM_ATTENUATION_DIST  = 3.5;
const GEM_ENV_INTENSITY     = 4.0;
const WIREFRAME_OPACITY     = 0.04;
const SPARKLE_COUNT         = 120;
const SPARKLE_SIZE          = 0.025;

// ── Public API types ──────────────────────────────────────────────────────────

export interface LuminaOptions {
  container:    HTMLElement;
  width?:       number;
  height?:      number;
  background?:  string | number | null;
  autoRotate?:  boolean;
  pixelRatio?:  number;
  /** Cap the render loop frame rate. Useful for gallery thumbnails (e.g. 24). Default: 60 */
  targetFPS?:   number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): number {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

// ── Internal types ────────────────────────────────────────────────────────────

interface OrbitingLight {
  light:     THREE.PointLight;
  r:         number;
  speed:     number;   // current = baseSpeed * dna.speed
  baseSpeed: number;   // raw config speed before dna.speed multiplier
  phase:     number;
  y:         number;
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export class LuminaRenderer {
  private renderer:    THREE.WebGLRenderer;
  private scene:       THREE.Scene;
  private camera:      THREE.PerspectiveCamera;
  private gemMesh!:    THREE.Mesh;
  private wireframe!:  THREE.Mesh;   // child of gemMesh, shares geometry
  private rimLight!:   THREE.DirectionalLight;
  private sparkles:    THREE.Points | null = null;
  private envTex:      THREE.Texture | null = null;
  private orbitLights: OrbitingLight[] = [];
  private clock:       THREE.Clock;
  private frameMin:    number;       // minimum ms between renders (FPS cap)
  private lastFrame:   number = 0;
  dna:                 GemDNA;
  private animFrameId: number | null = null;
  private destroyed    = false;

  constructor(input: string, overrides: Partial<GemDNA>, options: LuminaOptions) {
    const cuts   = listCuts();
    const base   = stringToDNA(input, cuts);
    const merged = { ...base, ...overrides };
    this.dna     = { ...merged, cut: cuts.includes(merged.cut) ? merged.cut : base.cut };

    const container = options.container;
    if (!container) throw new Error('[lumina-gem] options.container is required.');

    const width    = options.width  ?? (container.clientWidth  || 400);
    const height   = options.height ?? (container.clientHeight || 400);
    const bg       = options.background !== undefined ? options.background : null;
    this.frameMin  = options.targetFPS ? (1000 / options.targetFPS) : 0;

    // ── WebGL renderer ─────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      antialias:             true,
      alpha:                 bg === null,
      powerPreference:       'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
    this.renderer.shadowMap.enabled   = false;
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    this.scene  = new THREE.Scene();
    if (bg !== null) this.scene.background = new THREE.Color(bg);

    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    this.camera.position.set(0, 0.2, 2.4);
    this.camera.lookAt(0, -0.05, 0);

    this._buildEnvMap();
    this._buildGem();
    this._buildLights();
    this._buildSparkles();

    this.clock = new THREE.Clock();
    if (options.autoRotate !== false) this._startLoop();
  }

  // ── Private builders ──────────────────────────────────────────────────────

  private _buildEnvMap(): void {
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(6, 32, 16),
      new THREE.MeshBasicMaterial({ color: hslToHex(this.dna.light1Hue, 40, 5), side: THREE.BackSide })
    ));
    for (let i = 0; i < ENV_POINT_COUNT; i++) {
      const theta   = (i / ENV_POINT_COUNT) * Math.PI * 2;
      const phi     = Math.PI * 0.25 + (i % 4) * (Math.PI * 0.12);
      const isWhite = i % 3 === 0;
      const hue     = isWhite ? 0 : i % 3 === 1 ? this.dna.light1Hue : this.dna.light2Hue;
      const col     = isWhite
        ? new THREE.Color(2.5, 2.5, 2.5)
        : new THREE.Color().setHSL(hue / 360, 1.0, 0.9).multiplyScalar(1.8);
      const spot = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 6),
        new THREE.MeshBasicMaterial({ color: col })
      );
      spot.position.set(
        5.5 * Math.sin(phi) * Math.cos(theta),
        5.5 * Math.cos(phi),
        5.5 * Math.sin(phi) * Math.sin(theta),
      );
      envScene.add(spot);
    }
    for (let i = 0; i < ENV_FILL_COUNT; i++) {
      const theta = (i / ENV_FILL_COUNT) * Math.PI * 2;
      const fill  = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 8, 8),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(((this.dna.hue + i * 90) % 360) / 360, 0.6, 0.18),
        })
      );
      fill.position.set(ENV_FILL_RADIUS * Math.cos(theta), -1, ENV_FILL_RADIUS * Math.sin(theta));
      envScene.add(fill);
    }
    const pmrem  = new THREE.PMREMGenerator(this.renderer);
    const target = pmrem.fromScene(envScene, ENV_BLUR_RADIUS);
    pmrem.dispose();
    this.envTex?.dispose();
    this.envTex            = target.texture;
    this.scene.environment = this.envTex;
  }

  private _buildGem(): void {
    const gemColor = new THREE.Color().setHSL(this.dna.hue / 360, this.dna.saturation * 0.75, 0.45);
    const attColor = new THREE.Color().setHSL(this.dna.hue / 360, 1.0, 0.28);
    const geo      = buildGeometry(this.dna.cut, this.dna.facets);
    applyDistortions(geo, this.dna);
    const mat = new THREE.MeshPhysicalMaterial({
      color:                     gemColor,
      metalness:                 0.0,
      roughness:                 0.0,
      transmission:              GEM_TRANSMISSION,
      thickness:                 GEM_THICKNESS,
      ior:                       this.dna.ior,
      reflectivity:              1.0,
      iridescence:               this.dna.brilliance,
      iridescenceIOR:            2.0,
      iridescenceThicknessRange: GEM_IRIDESCENCE_RANGE,
      envMapIntensity:           GEM_ENV_INTENSITY,
      attenuationColor:          attColor,
      attenuationDistance:       GEM_ATTENUATION_DIST,
      transparent:               true,
      side:                      THREE.DoubleSide,
    });
    this.gemMesh           = new THREE.Mesh(geo, mat);
    this.gemMesh.rotation.z = this.dna.tilt;
    this.scene.add(this.gemMesh);

    this.wireframe = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xffffff, wireframe: true, transparent: true, opacity: WIREFRAME_OPACITY,
    }));
    this.gemMesh.add(this.wireframe);
  }

  private _buildLights(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.05));
    const configs = [
      { color: 0xfff4e0,                               intensity: 180, r: 1.6, speed:  0.55, phase: 0,             y:  1.0 },
      { color: hslToHex(this.dna.light1Hue, 100, 65), intensity: 140, r: 1.8, speed: -0.42, phase: Math.PI * 2/3, y:  0.3 },
      { color: hslToHex(this.dna.light2Hue, 100, 65), intensity: 120, r: 1.5, speed:  0.80, phase: Math.PI * 4/3, y: -0.2 },
      { color: 0xc8d8ff,                               intensity:  80, r: 2.0, speed: -0.30, phase: Math.PI,       y:  1.4 },
    ];
    configs.forEach(cfg => {
      const light = new THREE.PointLight(cfg.color, cfg.intensity, 6);
      light.position.set(cfg.r, cfg.y, 0);
      this.scene.add(light);
      this.orbitLights.push({
        light,
        r:         cfg.r,
        speed:     cfg.speed * this.dna.speed,
        baseSpeed: cfg.speed,
        phase:     cfg.phase,
        y:         cfg.y,
      });
    });
    this.rimLight = new THREE.DirectionalLight(
      hslToHex((this.dna.hue + 160) % 360, 80, 55), 1.8
    );
    this.rimLight.position.set(0.5, -1.5, -1.5);
    this.scene.add(this.rimLight);
  }

  private _buildSparkles(): void {
    const pos = new Float32Array(SPARKLE_COUNT * 3);
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const r     = 0.9 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.sparkles = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: SPARKLE_SIZE, transparent: true, opacity: 0.5, sizeAttenuation: true,
    }));
    this.scene.add(this.sparkles);
  }

  // ── Animation loop ────────────────────────────────────────────────────────

  private _startLoop(): void {
    const tick = (now: number) => {
      if (this.destroyed) return;
      this.animFrameId = requestAnimationFrame(tick);

      // FPS cap: skip render if not enough time has passed
      if (this.frameMin > 0 && now - this.lastFrame < this.frameMin) return;
      this.lastFrame = now;

      const t = this.clock.getElapsedTime();
      this.gemMesh.rotation.y = t * this.dna.speed * 0.4;
      this.gemMesh.rotation.x = Math.sin(t * 0.3) * 0.12 + this.dna.tilt;
      for (const { light, r, speed, phase, y } of this.orbitLights) {
        light.position.set(
          r * Math.cos(t * speed + phase),
          y + Math.sin(t * 0.38 + phase) * 0.35,
          r * Math.sin(t * speed + phase),
        );
      }
      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame(tick);
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Swap to a new seed without touching the WebGL context.
   * Updates geometry, material uniforms, and light colors entirely in-place —
   * no scene graph mutations, no shader recompilation, no env map rebuild.
   */
  update(input: string, overrides: Partial<GemDNA> = {}): void {
    if (this.destroyed) return;

    const cuts   = listCuts();
    const base   = stringToDNA(input, cuts);
    const merged = { ...base, ...overrides };
    this.dna     = { ...merged, cut: cuts.includes(merged.cut) ? merged.cut : base.cut };

    // ── Geometry: replace buffer data, reuse mesh & material objects ──────
    const newGeo = buildGeometry(this.dna.cut, this.dna.facets);
    applyDistortions(newGeo, this.dna);
    const oldGeo         = this.gemMesh.geometry;
    this.gemMesh.geometry    = newGeo;
    this.wireframe.geometry  = newGeo;   // shares same geometry
    oldGeo.dispose();

    // ── Material: update uniforms in-place — no shader recompilation ──────
    const mat = this.gemMesh.material as THREE.MeshPhysicalMaterial;
    mat.color.setHSL(this.dna.hue / 360, this.dna.saturation * 0.75, 0.45);
    mat.attenuationColor.setHSL(this.dna.hue / 360, 1.0, 0.28);
    mat.ior         = this.dna.ior;
    mat.iridescence = this.dna.brilliance;
    // Do NOT set mat.needsUpdate — we only changed uniform values (Color, float),
    // not shader defines. needsUpdate forces Three.js to re-run initMaterial()
    // which re-validates all ~40 uniforms and causes a visible hitch.
    this.gemMesh.rotation.z = this.dna.tilt;

    // ── Lights: update colors and speeds in-place ─────────────────────────
    if (this.orbitLights.length >= 4) {
      this.orbitLights[1].light.color.setHex(hslToHex(this.dna.light1Hue, 100, 65));
      this.orbitLights[2].light.color.setHex(hslToHex(this.dna.light2Hue, 100, 65));
      for (const ol of this.orbitLights) ol.speed = ol.baseSpeed * this.dna.speed;
    }
    this.rimLight?.color.setHex(hslToHex((this.dna.hue + 160) % 360, 80, 55));

    // ── Env map: intentionally NOT rebuilt here ───────────────────────────
    // Rebuilding PMREMGenerator.fromScene() takes ~100 ms and would block
    // every other render loop. The existing env map stays; the dynamic point
    // lights handle the per-seed colour variation without any freeze.
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  pause(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  play(): void {
    if (this.animFrameId === null && !this.destroyed) this._startLoop();
  }

  destroy(): void {
    this.destroyed = true;
    this.pause();
    this.scene.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const m = mesh.material;
        Array.isArray(m) ? m.forEach(x => x.dispose()) : (m as THREE.Material).dispose();
      }
    });
    this.envTex?.dispose();
    this.orbitLights.length = 0;
    this.renderer.forceContextLoss();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

export function createGem(
  input: string, overrides: Partial<GemDNA>, options: LuminaOptions
): LuminaRenderer {
  return new LuminaRenderer(input, overrides, options);
}
