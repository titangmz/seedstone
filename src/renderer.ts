import * as THREE from 'three';
import { buildGeometry, GemCut } from './geometries/index';
import { stringToDNA, GemDNA } from './hash';

// ── Renderer constants ────────────────────────────────────────────────────────

/** Slightly under 1.0 — prevents blown-out facet highlights while keeping fire. */
const TONE_MAPPING_EXPOSURE = 0.85;

/** Number of tiny point-like spheres in the env map — each produces one specular spike per facet. */
const ENV_POINT_COUNT = 16;

/** Number of large soft fill spheres in the env map — prevent fully-black shadow faces. */
const ENV_FILL_COUNT = 4;

/** blurRadius=0 on PMREMGenerator → no pre-filtering → maximum per-facet sharpness. */
const ENV_BLUR_RADIUS = 0;

/** Radius of the soft fill panels in world units. */
const ENV_FILL_RADIUS = 4;

/** Gem material: fraction of light transmitted through the crystal body. */
const GEM_TRANSMISSION = 0.92;

/** Gem material: optical depth used to compute attenuation colour tinting. */
const GEM_THICKNESS = 0.7;

/** Gem material: iridescence thin-film thickness range in nm — covers visible spectrum. */
const GEM_IRIDESCENCE_RANGE: [number, number] = [100, 800];

/** Gem material: distance in world units over which attenuation colour saturates. */
const GEM_ATTENUATION_DIST = 3.5;

/** Env map contribution multiplier on the gem material. */
const GEM_ENV_INTENSITY = 4.0;

/** Wireframe overlay opacity — just visible enough to hint at facet edges. */
const WIREFRAME_OPACITY = 0.04;

/** Number of sparkle particles around the gem. */
const SPARKLE_COUNT = 120;

/** Point size of each sparkle in world units. */
const SPARKLE_SIZE = 0.025;

// ── Public API types ──────────────────────────────────────────────────────────

export interface LuminaOptions {
  /** DOM element to render into. Required. */
  container: HTMLElement;
  /** Width in px. Defaults to container.clientWidth or 400. */
  width?: number;
  /** Height in px. Defaults to container.clientHeight or 400. */
  height?: number;
  /** Background colour (CSS string, hex number, or null for transparent). Default: null */
  background?: string | number | null;
  /** Gem cut style. Default: 'brilliant' */
  cut?: GemCut;
  /** Auto-start rotation on construction. Default: true */
  autoRotate?: boolean;
  /** Device pixel ratio. Default: min(window.devicePixelRatio, 2) */
  pixelRatio?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** HSL (h=0-360, s=0-100, l=0-100) → packed 24-bit integer */
function hslToHex(h: number, s: number, l: number): number {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

// ── Renderer ──────────────────────────────────────────────────────────────────

/** Per-light orbital parameters stored alongside the Three.js PointLight. */
interface OrbitingLight {
  light:  THREE.PointLight;
  r:      number;  // orbit radius in world units
  speed:  number;  // radians per second (signed — negative = reverse orbit)
  phase:  number;  // initial angular offset in radians
  y:      number;  // base Y position; a slow sine wave is added on top
}

export class LuminaRenderer {
  private renderer:      THREE.WebGLRenderer;
  private scene:         THREE.Scene;
  private camera:        THREE.PerspectiveCamera;
  private gemMesh!:      THREE.Mesh;
  private orbitLights:   OrbitingLight[] = [];
  private clock:         THREE.Clock;
  readonly dna:          GemDNA;
  private animFrameId:   number | null = null;
  private destroyed      = false;

  constructor(input: string, options: LuminaOptions) {
    this.dna = stringToDNA(input);

    const container = options.container;
    if (!container) throw new Error('[lumina-gem] options.container is required.');

    const width  = options.width  ?? (container.clientWidth  || 400);
    const height = options.height ?? (container.clientHeight || 400);
    const bg     = options.background !== undefined ? options.background : null;
    const cut    = options.cut ?? 'brilliant';

    // ── WebGL renderer ────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      antialias:            true,
      alpha:                bg === null,
      powerPreference:      'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
    this.renderer.shadowMap.enabled   = false;
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    if (bg !== null) this.scene.background = new THREE.Color(bg);

    // ── Camera ────────────────────────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    this.camera.position.set(0, 0.2, 2.4);
    this.camera.lookAt(0, -0.05, 0);

    // ── Environment map ───────────────────────────────────────────────────────
    // High-contrast IBL: near-black sky + many tiny bright pinpoints.
    // Tiny spheres → sharp mirror-like specular spikes on each flat facet.
    this._buildEnvMap();

    // ── Gem ───────────────────────────────────────────────────────────────────
    this._buildGem(cut);

    // ── Lights ────────────────────────────────────────────────────────────────
    this._buildLights();

    // ── Sparkle particles ────────────────────────────────────────────────────
    this._buildSparkles();

    // ── Animation loop ────────────────────────────────────────────────────────
    this.clock = new THREE.Clock();
    if (options.autoRotate !== false) this._startLoop();
  }

  // ── Private setup ─────────────────────────────────────────────────────────

  /**
   * Build the PMREM environment map used for image-based lighting.
   *
   * Design: near-black sky dome + ENV_POINT_COUNT tiny bright spheres + ENV_FILL_COUNT
   * soft fill panels.  The tiny spheres produce one sharp specular spike per gem facet
   * (each flat facet reflects a different point source → distinct colour/brightness).
   * The fill panels prevent the unlit side from going fully black.
   */
  private _buildEnvMap(): void {
    const envScene = new THREE.Scene();

    // Near-black tinted sky dome — just dark enough to pop the specular spikes
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(6, 32, 16),
      new THREE.MeshBasicMaterial({ color: hslToHex(this.dna.light1Hue, 40, 5), side: THREE.BackSide })
    ));

    // Tiny bright spheres arranged in rings at varying elevation — each one
    // becomes a sharp mirror reflection on the gem facets.
    for (let i = 0; i < ENV_POINT_COUNT; i++) {
      const theta   = (i / ENV_POINT_COUNT) * Math.PI * 2;
      const phi     = Math.PI * 0.25 + (i % 4) * (Math.PI * 0.12);
      const isWhite = i % 3 === 0;
      const hue     = isWhite ? 0 : i % 3 === 1 ? this.dna.light1Hue : this.dna.light2Hue;
      const col     = isWhite
        ? new THREE.Color(2.5, 2.5, 2.5)                                    // HDR white
        : new THREE.Color().setHSL(hue / 360, 1.0, 0.9).multiplyScalar(1.8); // saturated accent

      const spot = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 6, 6), // tiny radius → pin-sharp reflection
        new THREE.MeshBasicMaterial({ color: col })
      );
      spot.position.set(
        5.5 * Math.sin(phi) * Math.cos(theta),
        5.5 * Math.cos(phi),
        5.5 * Math.sin(phi) * Math.sin(theta),
      );
      envScene.add(spot);
    }

    // Larger, dim fill spheres — one per quadrant to give some ambient colour
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
    const envTex = pmrem.fromScene(envScene, ENV_BLUR_RADIUS);
    this.scene.environment = envTex.texture;
    pmrem.dispose();
  }

  /**
   * Build the gem mesh with a MeshPhysicalMaterial tuned for a cut crystal:
   *   - transmission → refractive glass body (not opaque)
   *   - roughness = 0 → perfect mirror facets
   *   - iridescence → thin-film colour shift (prismatic "fire")
   *   - NO clearcoat → clearcoat adds a second Fresnel layer which looks plastic
   */
  private _buildGem(cut: GemCut): void {
    // Medium lightness base — env map + point lights provide contrast and drama
    const gemColor = new THREE.Color().setHSL(this.dna.hue / 360, this.dna.saturation * 0.75, 0.45);
    // Deep saturated tint: colours light that passes through the gem interior
    const attColor = new THREE.Color().setHSL(this.dna.hue / 360, 1.0, 0.28);

    const geo = buildGeometry(cut, this.dna.facets);
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

    this.gemMesh = new THREE.Mesh(geo, mat);
    this.gemMesh.rotation.z = this.dna.tilt;
    this.scene.add(this.gemMesh);

    // Thin wireframe overlay — subtle hint of facet edges, barely visible
    this.gemMesh.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xffffff, wireframe: true, transparent: true, opacity: WIREFRAME_OPACITY,
    })));
  }

  /**
   * Add orbiting point lights and a static rim light.
   *
   * Four point lights travel along horizontal circular orbits at different speeds
   * and phases — their moving reflections are what creates the gem's "fire" effect.
   * Keeping intensity high but range short (6 units) concentrates the highlight.
   */
  private _buildLights(): void {
    // Minimal ambient — most light comes from the env map + point lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.05));

    // Warm white key · DNA accent 1 · DNA accent 2 · cold blue fill
    const configs = [
      { color: 0xfff4e0,                               intensity: 180, r: 1.6, speed:  0.55, phase: 0,             y:  1.0 },
      { color: hslToHex(this.dna.light1Hue, 100, 65), intensity: 140, r: 1.8, speed: -0.42, phase: Math.PI * 2/3, y:  0.3 },
      { color: hslToHex(this.dna.light2Hue, 100, 65), intensity: 120, r: 1.5, speed:  0.80, phase: Math.PI * 4/3, y: -0.2 },
      { color: 0xc8d8ff,                               intensity:  80, r: 2.0, speed: -0.30, phase: Math.PI,       y:  1.4 },
    ];

    configs.forEach(cfg => {
      const light = new THREE.PointLight(cfg.color, cfg.intensity, /* range */ 6);
      light.position.set(cfg.r, cfg.y, 0); // will be updated each frame
      this.scene.add(light);
      this.orbitLights.push({
        light, r: cfg.r, speed: cfg.speed * this.dna.speed, phase: cfg.phase, y: cfg.y,
      });
    });

    // Complementary rim from below-back — adds edge glow and perceived depth
    const rim = new THREE.DirectionalLight(hslToHex((this.dna.hue + 160) % 360, 80, 55), 1.8);
    rim.position.set(0.5, -1.5, -1.5);
    this.scene.add(rim);
  }

  /** Scatter SPARKLE_COUNT tiny white points around the gem for extra sparkle. */
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
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: SPARKLE_SIZE, transparent: true, opacity: 0.5, sizeAttenuation: true,
    })));
  }

  /** Main render loop — rotates the gem and advances the orbiting lights. */
  private _startLoop(): void {
    const tick = () => {
      if (this.destroyed) return;
      this.animFrameId = requestAnimationFrame(tick);
      const t = this.clock.getElapsedTime();

      // Slow Y rotation + gentle X bob
      this.gemMesh.rotation.y = t * this.dna.speed * 0.4;
      this.gemMesh.rotation.x = Math.sin(t * 0.3) * 0.12 + this.dna.tilt;

      // Advance each orbiting light along its circular path
      for (const { light, r, speed, phase, y } of this.orbitLights) {
        light.position.set(
          r * Math.cos(t * speed + phase),
          y + Math.sin(t * 0.38 + phase) * 0.35, // slow vertical bob
          r * Math.sin(t * speed + phase),
        );
      }

      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /** Update canvas size — call this inside a ResizeObserver. */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /** Pause the animation loop. */
  pause(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /** Resume the animation loop. */
  play(): void {
    if (this.animFrameId === null && !this.destroyed) this._startLoop();
  }

  /** Remove the canvas and release all GPU resources. */
  destroy(): void {
    this.destroyed = true;
    this.pause();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const m = mesh.material;
        Array.isArray(m) ? m.forEach(x => x.dispose()) : (m as THREE.Material).dispose();
      }
    });
    this.orbitLights.length = 0;
  }
}

// ── Convenience factory ───────────────────────────────────────────────────────

/** Shorthand for `new LuminaRenderer(input, options)`. */
export function createGem(input: string, options: LuminaOptions): LuminaRenderer {
  return new LuminaRenderer(input, options);
}
