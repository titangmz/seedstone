<script setup lang="ts">
import { computed } from 'vue'
import type { GemDNA } from 'seedstone'

const props = defineProps<{ dna: GemDNA | null }>()

const PERFECTION_LABELS = [
  { min: 0.80, label: 'Flawless',    color: '#a5f3fc' },
  { min: 0.55, label: 'Fine',        color: '#86efac' },
  { min: 0.28, label: 'Included',    color: '#fde68a' },
  { min: 0.00, label: 'Rough',       color: '#fca5a5' },
]

function pct(value: number, min: number, max: number) {
  return Math.round(Math.max(0, Math.min(1, (value - min) / (max - min))) * 100)
}

function degrees(radians: number) {
  return Math.round(radians * (180 / Math.PI))
}

const d = computed(() => props.dna)

const hueCSS = computed(() =>
  d.value ? `hsl(${Math.round(d.value.hue)}, 70%, 60%)` : 'transparent'
)

const perfLabel = computed(() => {
  if (!d.value) return null
  return PERFECTION_LABELS.find(p => d.value.perfection >= p.min) ?? PERFECTION_LABELS.at(-1)!
})

const stats = computed(() => {
  if (!d.value) return []
  return [
    {
      label: 'Saturation',
      value: `${Math.round(d.value.saturation * 100)}%`,
      pct:   pct(d.value.saturation, 0.55, 1.0),
      color: `hsl(${d.value.hue}, 80%, 55%)`,
    },
    {
      label: 'IOR',
      value: d.value.ior.toFixed(2),
      pct:   pct(d.value.ior, 1.8, 2.8),
      color: '#a78bfa',
    },
    {
      label: 'Fire',
      value: `${Math.round(d.value.brilliance * 100)}%`,
      pct:   pct(d.value.brilliance, 0.3, 1.0),
      color: `hsl(${d.value.light1Hue}, 90%, 65%)`,
    },
    {
      label: 'Speed',
      value: `×${d.value.speed.toFixed(2)}`,
      pct:   pct(d.value.speed, 0.6, 1.4),
      color: '#60a5fa',
    },
    {
      label: 'Perfection',
      value: `${Math.round(d.value.perfection * 100)}%`,
      pct:   Math.round(d.value.perfection * 100),
      color: perfLabel.value?.color ?? '#a5f3fc',
    },
  ]
})
</script>

<template>
  <div class="dna-panel" :class="{ loaded: !!dna }">

    <!-- Header -->
    <div class="panel-header">
      <span class="panel-icon">◈</span>
      <span class="panel-title">Gem Genome</span>
    </div>

    <template v-if="d">
      <!-- Cut + colour row -->
      <div class="cut-row">
        <div class="cut-badge">{{ d.cut }}</div>
        <div class="hue-swatch" :style="{ background: hueCSS }" :title="`Hue ${Math.round(d.hue)}°`" />
      </div>

      <!-- Perfection grade -->
      <div class="grade-row" v-if="perfLabel">
        <span class="grade-label">Grade</span>
        <span class="grade-value" :style="{ color: perfLabel.color }">{{ perfLabel.label }}</span>
      </div>

      <!-- Stat bars -->
      <div class="stats">
        <div v-for="s in stats" :key="s.label" class="stat">
          <span class="stat-label">{{ s.label }}</span>
          <div class="stat-track">
            <div class="stat-fill" :style="{ width: s.pct + '%', background: s.color }" />
          </div>
          <span class="stat-value">{{ s.value }}</span>
        </div>
      </div>

      <!-- Tilt -->
      <div class="meta-row">
        <div class="meta-chip">Tilt {{ d.tilt > 0 ? '+' : '' }}{{ degrees(d.tilt) }}°</div>
      </div>

      <!-- Accent light swatches -->
      <div class="lights-row">
        <span class="lights-label">Lights</span>
        <div class="light-dot" :style="{ background: `hsl(${Math.round(d.light1Hue)}, 90%, 65%)` }" />
        <div class="light-dot" :style="{ background: `hsl(${Math.round(d.light2Hue)}, 90%, 65%)` }" />
      </div>
    </template>

    <!-- Placeholder while loading -->
    <template v-else>
      <div class="skeleton" v-for="i in 6" :key="i" :style="{ width: (50 + i * 7) + '%' }" />
    </template>

  </div>
</template>

<style scoped>
.dna-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px 20px 20px;
  backdrop-filter: blur(12px);
  box-shadow: var(--glow), 0 8px 32px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
}

/* ── Header ─────────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-icon {
  color: var(--accent);
  font-size: 1rem;
}
.panel-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

/* ── Cut + hue ───────────────────────────────────────────────── */
.cut-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cut-badge {
  flex: 1;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(167,139,250,0.12);
  border: 1px solid rgba(167,139,250,0.25);
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Consolas', 'SF Mono', monospace;
  color: var(--accent);
  letter-spacing: 0.04em;
  text-align: center;
}
.hue-swatch {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
}

/* ── Grade ────────────────────────────────────────────────────── */
.grade-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}
.grade-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.grade-value {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

/* ── Stat bars ───────────────────────────────────────────────── */
.stats {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.stat {
  display: grid;
  grid-template-columns: 72px 1fr 44px;
  align-items: center;
  gap: 8px;
}
.stat-label {
  font-size: 0.71rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
  white-space: nowrap;
}
.stat-track {
  height: 5px;
  border-radius: 3px;
  background: rgba(255,255,255,0.07);
  overflow: hidden;
}
.stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
}
.stat-value {
  font-size: 0.72rem;
  font-family: 'Consolas', 'SF Mono', monospace;
  color: rgba(255,255,255,0.55);
  text-align: right;
}

/* ── Meta chips ──────────────────────────────────────────────── */
.meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.meta-chip {
  padding: 3px 10px;
  border-radius: 100px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  font-size: 0.72rem;
  color: rgba(255,255,255,0.45);
  font-family: 'Consolas', 'SF Mono', monospace;
}

/* ── Accent lights ───────────────────────────────────────────── */
.lights-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lights-label {
  font-size: 0.71rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
  margin-right: 2px;
}
.light-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 0 8px currentColor;
}

/* ── Skeleton ─────────────────────────────────────────────────── */
.skeleton {
  height: 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  animation: shimmer 1.6s ease-in-out infinite alternate;
}
@keyframes shimmer {
  from { opacity: 0.4; }
  to   { opacity: 0.9; }
}
</style>
