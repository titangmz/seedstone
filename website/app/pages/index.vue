<script setup lang="ts">
import { ref, computed } from 'vue'

// ── Shared gem seed state ─────────────────────────────────────────────────────
const activeSeed = useActiveSeed()

// ── SEO ───────────────────────────────────────────────────────────────────────
useSeoMeta({
  title:       'Lumina Gem — Every string is a unique gemstone',
  description: 'Render a beautiful 3D rotating gemstone from any string. Deterministic, WebGL-powered, Three.js.',
  ogTitle:     'Lumina Gem',
  ogDescription: 'Every string is a unique gemstone',
})

// ── Constants ─────────────────────────────────────────────────────────────────
const GALLERY_SEEDS = ['cosmos', 'prism', 'fracture', 'obsidian', 'solstice', 'nebula', 'quartz', 'entropy']
const QUICK_PICKS   = ['hello world', '0x1a2b3c', 'stardust', 'ultraviolet', 'midnight', 'aurora']
const FACET_LABELS: Record<number, string> = { 6: 'Hexagonal', 7: 'Heptagonal', 8: 'Octagonal' }

// ── State ─────────────────────────────────────────────────────────────────────
const inputValue = ref(activeSeed.value)
const dna        = ref<Record<string, unknown> | null>(null)

// ── Helpers ───────────────────────────────────────────────────────────────────
function hueToCSS(hue: number, alpha = 0.18) {
  return `hsla(${Math.round(hue)},70%,60%,${alpha})`
}

const dnaPills = computed(() => {
  if (!dna.value) return []
  const d = dna.value as any
  return [
    { label: `Hue ${Math.round(d.hue)}°`,                             color: hueToCSS(d.hue) },
    { label: `Sat ${Math.round(d.saturation * 100)}%`,                color: 'rgba(255,255,255,0.06)' },
    { label: FACET_LABELS[d.facets] ?? `${d.facets} facets`,          color: 'rgba(255,255,255,0.06)' },
    { label: `IOR ${d.ior.toFixed(2)}`,                               color: 'rgba(255,255,255,0.06)' },
    { label: `Speed ×${d.speed.toFixed(2)}`,                          color: 'rgba(255,255,255,0.06)' },
    { label: `Fire ${Math.round((d.brilliance ?? 0.5) * 100)}%`,      color: hueToCSS(d.light1Hue, 0.18) },
  ]
})

// ── Actions ───────────────────────────────────────────────────────────────────
function renderSeed(s: string) {
  const seed = s.trim() || 'lumina'
  activeSeed.value = seed
  inputValue.value  = seed
}

function onRenderClick()           { renderSeed(inputValue.value) }
function onKeydown(e: KeyboardEvent) { if (e.key === 'Enter') renderSeed(inputValue.value) }
function onGalleryPick(seed: string) {
  renderSeed(seed)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Debounced live preview
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (inputValue.value.trim()) renderSeed(inputValue.value)
  }, 420)
}
</script>

<template>
  <!-- Starfield (client-only — needs canvas + RAF) -->
  <ClientOnly><StarfieldCanvas /></ClientOnly>

  <div class="page">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="header">
      <h1>✦ Lumina Gem</h1>
      <p>Every string is a unique gemstone</p>
      <span class="badge">WebGL · Three.js · MeshPhysical</span>
    </header>

    <!-- ── Input card ─────────────────────────────────────────────────────── -->
    <div class="input-card">
      <label for="gem-input">Your string</label>
      <div class="input-row">
        <input
          id="gem-input"
          v-model="inputValue"
          type="text"
          placeholder="Type anything…"
          autocomplete="off"
          spellcheck="false"
          @keydown="onKeydown"
          @input="onInput"
        />
        <button class="btn" @click="onRenderClick">Render ✦</button>
      </div>
      <div class="quick-picks">
        <button
          v-for="val in QUICK_PICKS"
          :key="val"
          class="chip"
          @click="renderSeed(val)"
        >{{ val }}</button>
      </div>
    </div>

    <!-- ── Gem viewport (client-only — WebGL) ─────────────────────────────── -->
    <ClientOnly>
      <GemViewer :seed="activeSeed" @dna="(d) => dna = d" />
    </ClientOnly>

    <!-- ── DNA pills ──────────────────────────────────────────────────────── -->
    <div class="gem-info">
      <div class="dna-label">Gem DNA</div>
      <div class="dna-pills">
        <span
          v-for="pill in dnaPills"
          :key="pill.label"
          class="dna-pill"
          :style="{ background: pill.color }"
        >{{ pill.label }}</span>
      </div>
    </div>

    <!-- ── Gallery (client-only — WebGL) ──────────────────────────────────── -->
    <ClientOnly>
      <GemGallery :seeds="GALLERY_SEEDS" @pick="onGalleryPick" />
    </ClientOnly>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <footer class="footer">
      <p>
        Built with
        <a href="https://threejs.org" target="_blank" rel="noopener">Three.js</a>
        ·
        <a href="https://github.com/titangmz/lumina-gem" target="_blank" rel="noopener">lumina-gem on GitHub</a>
      </p>
    </footer>

  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────────── */
.page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 80px;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.header {
  text-align: center;
  margin-bottom: 44px;
}

.header h1 {
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #e0c3fc 0%, #a78bfa 40%, #60a5fa 80%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 28px rgba(167,139,250,0.5));
  margin-bottom: 10px;
}

.header p {
  color: var(--muted);
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.badge {
  display: inline-block;
  margin-top: 12px;
  padding: 3px 12px;
  border-radius: 100px;
  background: rgba(167,139,250,0.12);
  border: 1px solid rgba(167,139,250,0.3);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

/* ── Input card ─────────────────────────────────────────────────────────────── */
.input-card {
  width: 100%;
  max-width: 560px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px 28px 24px;
  margin-bottom: 40px;
  backdrop-filter: blur(12px);
  box-shadow: var(--glow), 0 8px 40px rgba(0,0,0,0.45);
}

.input-card label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.input-row input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.06);
  color: var(--text);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-row input:focus {
  border-color: rgba(167,139,250,0.6);
  box-shadow: 0 0 0 3px rgba(167,139,250,0.15);
}
.input-row input::placeholder { color: rgba(255,255,255,0.25); }

.btn {
  padding: 12px 22px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  color: #fff;
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
}
.btn:hover  { opacity: 0.88; transform: translateY(-1px); }
.btn:active { transform: translateY(0); }

.quick-picks {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
}

.chip {
  padding: 5px 13px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.chip:hover {
  background: rgba(167,139,250,0.14);
  color: var(--accent);
  border-color: rgba(167,139,250,0.35);
}

/* ── DNA pills ──────────────────────────────────────────────────────────────── */
.gem-info {
  margin-top: 24px;
  text-align: center;
  min-height: 56px;
}

.dna-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 6px;
}

.dna-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.dna-pill {
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 0.73rem;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: #c5cae9;
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.footer {
  margin-top: 72px;
  text-align: center;
  color: rgba(255,255,255,0.18);
  font-size: 0.8rem;
}
.footer a { color: var(--muted); text-decoration: none; }
.footer a:hover { color: var(--accent); }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .input-row { flex-direction: column; }
}
</style>
