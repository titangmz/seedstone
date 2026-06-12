<script setup lang="ts">
import { ref } from 'vue'

const activeSeed      = useActiveSeed()
const activeOverrides = ref<Record<string, unknown>>({})

useSeoMeta({
  title:         'Lumina Gem — Every string is a unique gemstone',
  description:   'Render a beautiful 3D rotating gemstone from any string. Deterministic, WebGL-powered, Three.js.',
  ogTitle:       'Lumina Gem',
  ogDescription: 'Every string is a unique gemstone',
})

const QUICK_PICKS = ['hello world', '0x1a2b3c', 'stardust', 'ultraviolet', 'midnight', 'aurora']

const inputValue = ref(activeSeed.value)
const dna        = ref<Record<string, unknown> | null>(null)

function renderSeed(s: string, overrides: Record<string, unknown> = {}) {
  const seed            = s.trim() || 'lumina'
  activeSeed.value      = seed
  activeOverrides.value = overrides
  inputValue.value      = seed
}

function onRenderClick()             { renderSeed(inputValue.value) }
function onKeydown(e: KeyboardEvent) { if (e.key === 'Enter') renderSeed(inputValue.value) }
function onGalleryPick({ seed, overrides }: { seed: string; overrides: Record<string, unknown> }) {
  renderSeed(seed, overrides)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <ClientOnly><StarfieldCanvas /></ClientOnly>

  <div class="page">

    <header class="header">
      <h1>✦ Lumina Gem</h1>
      <p>Every string is a unique gemstone</p>
      <span class="badge">WebGL · Three.js · MeshPhysical</span>
    </header>

    <!-- shared-width wrapper: hero + gallery always the same width -->
    <div class="content">

      <!-- ── Hero (3-column on desktop) ──────────────────────────────────── -->
      <div class="hero">

        <!-- Left: input -->
        <div class="hero-left">
          <div class="input-card">
            <div class="card-header">
              <span class="card-icon">◈</span>
              <span class="card-title">Seed Crystal</span>
            </div>
            <div class="input-row">
              <input
                id="gem-input"
                v-model="inputValue"
                type="text"
                placeholder="Type anything…"
                autocomplete="off"
                spellcheck="false"
                @keydown="onKeydown"
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
        </div>

        <!-- Centre: gem -->
        <div class="hero-center">
          <ClientOnly>
            <GemViewer :seed="activeSeed" :overrides="activeOverrides" @dna="(d) => dna = d" />
          </ClientOnly>
        </div>

        <!-- Right: DNA panel -->
        <div class="hero-right">
          <GemDNA :dna="dna" />
        </div>

      </div>

      <!-- ── Gallery ─────────────────────────────────────────────────────── -->
      <ClientOnly>
        <GemGallery @pick="onGalleryPick" />
      </ClientOnly>

      <!-- ── Footer ──────────────────────────────────────────────────────── -->
      <footer class="footer">
        <p>
          Built with
          <a href="https://threejs.org" target="_blank" rel="noopener">Three.js</a>
          ·
          <a href="https://github.com/titangmz/lumina-gem" target="_blank" rel="noopener">lumina-gem on GitHub</a>
        </p>
      </footer>

    </div>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px 80px;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.header {
  text-align: center;
  margin-bottom: 36px;
}
.header h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #e0c3fc 0%, #a78bfa 40%, #60a5fa 80%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 28px rgba(167,139,250,0.5));
  margin-bottom: 8px;
}
.header p   { color: var(--muted); font-size: 1rem; }
.badge {
  display: inline-block;
  margin-top: 10px;
  padding: 3px 12px;
  border-radius: 100px;
  background: rgba(167,139,250,0.12);
  border: 1px solid rgba(167,139,250,0.3);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

/* ── Shared-width content wrapper ───────────────────────────────────────────── */
.content {
  width: 100%;
  max-width: 1300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ── Hero grid ──────────────────────────────────────────────────────────────── */
.hero {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

@media (min-width: 960px) {
  .hero {
    display: grid;
    /* input fixed-narrow · gem · genome takes all remaining space */
    grid-template-columns: 1fr 420px 1fr;
    align-items: start;
    gap: 24px;
  }
}

/* ── Left column ────────────────────────────────────────────────────────────── */
.hero-left {
  width: 100%;
  max-width: 560px;
}
@media (min-width: 960px) {
  .hero-left { max-width: none; }
}

/* ── Centre column ──────────────────────────────────────────────────────────── */
.hero-center {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* ── Right column: DNA panel stretches to gem height ────────────────────────── */
.hero-right {
  width: 100%;
  max-width: 560px;
}
@media (min-width: 960px) {
  .hero-right {
    max-width: none;
    align-self: stretch;
    display: flex;
    flex-direction: column;
  }
  .hero-right > :deep(*) { flex: 1; }
}

/* ── Input card ─────────────────────────────────────────────────────────────── */
.input-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px 24px 20px;
  backdrop-filter: blur(12px);
  box-shadow: var(--glow), 0 8px 40px rgba(0,0,0,0.45);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.card-icon {
  color: var(--accent);
  font-size: 1rem;
}
.card-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.input-row {
  display: flex;
  gap: 10px;
}
.input-row input {
  flex: 1;
  padding: 11px 15px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.06);
  color: var(--text);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 0;
}
.input-row input:focus {
  border-color: rgba(167,139,250,0.6);
  box-shadow: 0 0 0 3px rgba(167,139,250,0.15);
}
.input-row input::placeholder { color: rgba(255,255,255,0.22); }

.btn {
  padding: 11px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  color: #fff;
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn:hover  { opacity: 0.88; transform: translateY(-1px); }
.btn:active { transform: translateY(0); }

.quick-picks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.chip {
  padding: 4px 12px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.chip:hover {
  background: rgba(167,139,250,0.14);
  color: var(--accent);
  border-color: rgba(167,139,250,0.35);
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
</style>
