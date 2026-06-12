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
      <div class="header-eyebrow">
        <span class="eyebrow-rule" /><span class="eyebrow-text">3D gem renderer</span><span class="eyebrow-rule reverse" />
      </div>
      <h1>✦ Lumina Gem</h1>
      <p class="header-sub">Every string is a unique gemstone</p>
      <div class="tech-stack">
        <span class="tech-badge">WebGL</span>
        <span class="tech-badge">Three.js</span>
        <span class="tech-badge">MeshPhysical</span>
      </div>
    </header>

    <div class="content">

      <!-- ── Hero ───────────────────────────────────────────────────────────── -->
      <div class="hero">

        <!-- Left: seed input -->
        <div class="hero-left">
          <div class="input-card">
            <div class="card-header">
              <span class="card-icon">◈</span>
              <span class="card-title">Seed Crystal</span>
            </div>
            <p class="card-tagline">Type any string to forge a unique crystalline gem, deterministically generated from your input.</p>
            <input
              id="gem-input"
              v-model="inputValue"
              type="text"
              class="seed-input"
              placeholder="Type anything…"
              autocomplete="off"
              spellcheck="false"
              @keydown="onKeydown"
            />
            <button class="btn" @click="onRenderClick">Render ✦</button>
            <div class="picks-divider"><span>try these</span></div>
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
          <div class="gem-caption">{{ activeSeed }}</div>
        </div>

        <!-- Right: genome panel -->
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
  width: 100%;
  text-align: center;
  margin-bottom: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.header-eyebrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.eyebrow-text {
  font-size: 0.67rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(167,139,250,0.45);
  white-space: nowrap;
}
.eyebrow-rule {
  display: block;
  width: 48px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(167,139,250,0.35));
}
.eyebrow-rule.reverse {
  background: linear-gradient(90deg, rgba(167,139,250,0.35), transparent);
}

.header h1 {
  font-size: clamp(2.6rem, 5.5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
  background: linear-gradient(135deg, #f3e8ff 0%, #c084fc 28%, #818cf8 58%, #e879f9 82%, #f5d0fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 48px rgba(192,132,252,0.5));
  margin: 0;
}
.header-sub {
  font-size: 1rem;
  color: rgba(255,255,255,0.38);
  letter-spacing: 0.015em;
  margin: 0;
}

.tech-stack {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tech-badge {
  padding: 4px 14px;
  border-radius: 100px;
  background: rgba(167,139,250,0.08);
  border: 1px solid rgba(167,139,250,0.18);
  font-size: 0.69rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(167,139,250,0.65);
}

/* ── Shared-width wrapper ────────────────────────────────────────────────────── */
.content {
  width: 100%;
  max-width: 1300px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Hero grid ───────────────────────────────────────────────────────────────── */
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
    grid-template-columns: 1fr 420px 1fr;
    align-items: stretch;
    gap: 24px;
  }
}

/* ── Left column ─────────────────────────────────────────────────────────────── */
.hero-left {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
}
@media (min-width: 960px) {
  .hero-left { max-width: none; }
}

/* ── Input card ──────────────────────────────────────────────────────────────── */
.input-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  backdrop-filter: blur(12px);
  box-shadow: var(--glow), 0 8px 40px rgba(0,0,0,0.45);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-icon  { color: var(--accent); font-size: 1rem; }
.card-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.card-tagline {
  font-size: 0.8rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.32);
  margin: 0;
}

.seed-input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 15px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.06);
  color: var(--text);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.seed-input:focus {
  border-color: rgba(167,139,250,0.6);
  box-shadow: 0 0 0 3px rgba(167,139,250,0.15);
}
.seed-input::placeholder { color: rgba(255,255,255,0.22); }

.btn {
  width: 100%;
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  color: #fff;
  transition: opacity 0.2s, transform 0.15s;
  letter-spacing: 0.02em;
}
.btn:hover  { opacity: 0.88; transform: translateY(-1px); }
.btn:active { transform: translateY(0); }

.picks-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
}
.picks-divider span {
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.18);
  white-space: nowrap;
}
.picks-divider::before,
.picks-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.07);
}

.quick-picks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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

/* ── Centre column ───────────────────────────────────────────────────────────── */
.hero-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.gem-caption {
  font-size: 0.72rem;
  font-family: 'Consolas', 'SF Mono', monospace;
  color: rgba(255,255,255,0.22);
  letter-spacing: 0.06em;
  text-align: center;
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Right column ────────────────────────────────────────────────────────────── */
.hero-right {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
}
@media (min-width: 960px) {
  .hero-right { max-width: none; }
  .hero-right > :deep(*) { flex: 1; }
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */
.footer {
  margin-top: 72px;
  text-align: center;
  color: rgba(255,255,255,0.18);
  font-size: 0.8rem;
}
.footer a { color: var(--muted); text-decoration: none; }
.footer a:hover { color: var(--accent); }
</style>
