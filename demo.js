'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAR_COUNT        = 220;
const STAR_RADIUS_MIN   = 0.4;   // px
const STAR_RADIUS_RANGE = 1.3;   // px
const STAR_OPACITY_MIN  = 0.1;
const STAR_OPACITY_RANGE= 0.7;
const STAR_SPEED_MIN    = 0.0002; // blink cycles per frame
const STAR_SPEED_RANGE  = 0.0006;
const STAR_TIME_STEP    = 0.012;  // constant added to time each frame
const STAR_BLINK_SCALE  = 300;    // converts speed → visible blink frequency

const GALLERY_SIZE_PX   = 180;    // px — width/height of each gallery gem canvas
const GALLERY_BG_COLOR  = 0x07080f; // matches CSS --bg
const DEBOUNCE_MS       = 420;    // live preview debounce while typing

const GALLERY_SEEDS = [
  'cosmos', 'prism',   'fracture', 'obsidian',
  'solstice', 'nebula', 'quartz',  'entropy',
];

const FACET_LABELS = { 6: 'Hexagonal', 7: 'Heptagonal', 8: 'Octagonal' };

// ── Starfield background ──────────────────────────────────────────────────────

(function initStarfield() {
  const canvas = document.getElementById('stars-bg');
  const ctx    = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x:     Math.random(),
    y:     Math.random(),
    r:     STAR_RADIUS_MIN   + Math.random() * STAR_RADIUS_RANGE,
    o:     STAR_OPACITY_MIN  + Math.random() * STAR_OPACITY_RANGE,
    speed: STAR_SPEED_MIN    + Math.random() * STAR_SPEED_RANGE,
    phase: Math.random() * Math.PI * 2,
  }));

  let t = 0;
  function drawStars() {
    ctx.clearRect(0, 0, W, H);
    t += STAR_TIME_STEP;
    for (const s of stars) {
      const blink = s.o * (0.5 + 0.5 * Math.sin(t * s.speed * STAR_BLINK_SCALE + s.phase));
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${blink.toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(drawStars);
  }
  drawStars();
})();

// ── Main gem renderer ─────────────────────────────────────────────────────────

const { LuminaRenderer } = window.LuminaGem;

let mainGem = null;

const container = document.getElementById('gem-container');
const spinner   = document.getElementById('spinner');
const dnaPills  = document.getElementById('dna-pills');
const input     = document.getElementById('gem-input');

/** Convert a hue angle to a CSS hsla() string for pill backgrounds. */
function hueToCSS(hue, alpha = 0.18) {
  return `hsla(${Math.round(hue)},70%,60%,${alpha})`;
}

/**
 * Destroy the current main gem (if any) and render a new one for `str`.
 * Uses requestAnimationFrame so the spinner can paint before WebGL blocks the thread.
 */
function renderMainGem(str) {
  if (mainGem) { mainGem.destroy(); mainGem = null; }
  spinner.classList.remove('hidden');

  const size = container.clientWidth || 500;

  requestAnimationFrame(() => {
    mainGem = new LuminaRenderer(str, {
      container,
      width:      size,
      height:     size,
      background: null,
    });
    spinner.classList.add('hidden');
    renderDNAPills(mainGem.dna);
  });
}

/** Render the DNA info pills below the main gem. */
function renderDNAPills(dna) {
  const items = [
    { label: `Hue ${Math.round(dna.hue)}°`,                              color: hueToCSS(dna.hue) },
    { label: `Sat ${Math.round(dna.saturation * 100)}%`,                  color: 'rgba(255,255,255,0.06)' },
    { label: FACET_LABELS[dna.facets] ?? `${dna.facets} facets`,          color: 'rgba(255,255,255,0.06)' },
    { label: `IOR ${dna.ior.toFixed(2)}`,                                 color: 'rgba(255,255,255,0.06)' },
    { label: `Speed ×${dna.speed.toFixed(2)}`,                            color: 'rgba(255,255,255,0.06)' },
    { label: `Fire ${Math.round((dna.brilliance ?? 0.5) * 100)}%`,        color: hueToCSS(dna.light1Hue, 0.18) },
  ];
  dnaPills.innerHTML = items
    .map(({ label, color }) => `<span class="dna-pill" style="background:${color}">${label}</span>`)
    .join('');
}

// ── Input / button wiring ─────────────────────────────────────────────────────

document.getElementById('render-btn').addEventListener('click', () => {
  renderMainGem(input.value.trim() || 'lumina');
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') renderMainGem(input.value.trim() || 'lumina');
});

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const val = chip.dataset.val;
    input.value = val;
    renderMainGem(val);
  });
});

// Live preview while typing (debounced)
let debounceTimer = null;
input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const val = input.value.trim();
    if (val) renderMainGem(val);
  }, DEBOUNCE_MS);
});

// ── Gallery ───────────────────────────────────────────────────────────────────

/** Create a gallery card, attach a gem renderer, and wire up the click-to-load action. */
function createGalleryItem(seed) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.title     = `Render "${seed}"`;

  const wrap = document.createElement('div');
  wrap.className = 'gallery-gem-wrap';

  const label = document.createElement('div');
  label.className   = 'gallery-label';
  label.textContent = seed;

  item.appendChild(wrap);
  item.appendChild(label);

  new LuminaRenderer(seed, {
    container:  wrap,
    width:      GALLERY_SIZE_PX,
    height:     GALLERY_SIZE_PX,
    background: GALLERY_BG_COLOR,
  });

  item.addEventListener('click', () => {
    input.value = seed;
    renderMainGem(seed);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  return item;
}

const gallery = document.getElementById('gallery');
GALLERY_SEEDS.forEach(seed => gallery.appendChild(createGalleryItem(seed)));

// ── Initialise + resize support ───────────────────────────────────────────────

renderMainGem('lumina');

const ro = new ResizeObserver(() => {
  if (mainGem) {
    const s = container.clientWidth;
    mainGem.resize(s, s);
  }
});
ro.observe(container);
