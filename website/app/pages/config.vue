<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import type { SeedstoneRenderer } from 'seedstone'

useSeoMeta({ title: 'Seedstone — Config lab', robots: 'noindex' })

// ── Knob schema ───────────────────────────────────────────────────────────────
// Each knob maps a config.ts path to a slider range. Values are read from
// defaultConfig at mount, so this list never drifts from the real defaults.

interface Knob { path: string; min: number; max: number; step: number }
interface Section { title: string; knobs: Knob[] }

const SECTIONS: Section[] = [
  { title: 'Gem material', knobs: [
    { path: 'gem.material.transmission',        min: 0,    max: 1,    step: 0.01  },
    { path: 'gem.material.thickness',           min: 0,    max: 3,    step: 0.05  },
    { path: 'gem.material.reflectivity',        min: 0,    max: 1,    step: 0.01  },
    { path: 'gem.material.iridescenceIOR',      min: 1,    max: 2.33, step: 0.01  },
    { path: 'gem.material.attenuationDistance', min: 0.1,  max: 8,    step: 0.1   },
    { path: 'gem.material.envMapIntensity',     min: 0,    max: 12,   step: 0.1   },
  ]},
  { title: 'Gem colour', knobs: [
    { path: 'gem.bodyLightness',        min: 0, max: 1,   step: 0.01  },
    { path: 'gem.bodySaturationScale',  min: 0, max: 1,   step: 0.01  },
    { path: 'gem.attenuationLightness', min: 0, max: 1,   step: 0.01  },
    { path: 'gem.wireframeOpacity',     min: 0, max: 0.3, step: 0.005 },
  ]},
  { title: 'Motion', knobs: [
    { path: 'gem.spinRate',     min: 0, max: 2,   step: 0.05 },
    { path: 'gem.wobbleRate',   min: 0, max: 2,   step: 0.05 },
    { path: 'gem.wobbleAmount', min: 0, max: 0.5, step: 0.01 },
  ]},
  { title: 'Environment', knobs: [
    { path: 'environment.domeSaturation',     min: 0,    max: 1,   step: 0.01  },
    { path: 'environment.domeLightness',      min: 0,    max: 0.5, step: 0.005 },
    { path: 'environment.spotCount',          min: 0,    max: 48,  step: 1     },
    { path: 'environment.spotSize',           min: 0.01, max: 0.3, step: 0.005 },
    { path: 'environment.whiteSpotIntensity', min: 0,    max: 15,  step: 0.1   },
    { path: 'environment.tintSpotIntensity',  min: 0,    max: 10,  step: 0.1   },
    { path: 'environment.tintSpotLightness',  min: 0,    max: 1,   step: 0.01  },
    { path: 'environment.fillCount',          min: 0,    max: 8,   step: 1     },
    { path: 'environment.fillSaturation',     min: 0,    max: 1,   step: 0.01  },
    { path: 'environment.fillLightness',      min: 0,    max: 0.6, step: 0.01  },
    { path: 'environment.blurRadius',         min: 0,    max: 1,   step: 0.02  },
  ]},
  { title: 'Lights', knobs: [
    { path: 'lights.ambientIntensity', min: 0, max: 0.5, step: 0.01 },
    { path: 'lights.pointLightRange',  min: 0, max: 12,  step: 0.5  },
    { path: 'lights.tintSaturation',   min: 0, max: 1,   step: 0.01 },
    { path: 'lights.tintLightness',    min: 0, max: 1,   step: 0.01 },
    { path: 'lights.bobRate',          min: 0, max: 2,   step: 0.02 },
    { path: 'lights.bobAmount',        min: 0, max: 1,   step: 0.02 },
    { path: 'lights.rim.intensity',    min: 0, max: 6,   step: 0.1  },
    { path: 'lights.rim.hueOffset',    min: 0, max: 360, step: 5    },
    { path: 'lights.rim.saturation',   min: 0, max: 1,   step: 0.01 },
    { path: 'lights.rim.lightness',    min: 0, max: 1,   step: 0.01 },
  ]},
  { title: 'Sparkles', knobs: [
    { path: 'sparkles.count',       min: 0,    max: 500, step: 10    },
    { path: 'sparkles.size',        min: 0,    max: 0.1, step: 0.001 },
    { path: 'sparkles.radiusMin',   min: 0.3,  max: 2,   step: 0.05  },
    { path: 'sparkles.radiusRange', min: 0,    max: 3,   step: 0.05  },
    { path: 'sparkles.driftRate',   min: -0.3, max: 0.3, step: 0.01  },
    { path: 'sparkles.baseOpacity', min: 0,    max: 1,   step: 0.02  },
    { path: 'sparkles.pulseAmount', min: 0,    max: 0.5, step: 0.01  },
    { path: 'sparkles.pulseRate',   min: 0,    max: 3,   step: 0.05  },
  ]},
  { title: 'Renderer & camera', knobs: [
    { path: 'renderer.toneMappingExposure', min: 0.2, max: 2,  step: 0.05 },
    { path: 'camera.fov',                   min: 10,  max: 80, step: 1    },
  ]},
]

// ── State ─────────────────────────────────────────────────────────────────────

const containerRef = useTemplateRef<HTMLDivElement>('container')
const seed     = ref('seedstone')
const loaded   = ref(false)
const copied   = ref(false)
const values   = reactive<Record<string, number>>({})
const defaults = reactive<Record<string, number>>({})

let gem: SeedstoneRenderer | null = null
let ro: ResizeObserver | null = null
let applyTimer: ReturnType<typeof setTimeout> | undefined

// ── Path helpers ──────────────────────────────────────────────────────────────

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<any>((o, key) => o?.[key], obj)
}

function setPath(obj: Record<string, any>, path: string, value: number): void {
  const keys = path.split('.')
  const last = keys.pop()!
  let cursor = obj
  for (const key of keys) cursor = (cursor[key] ??= {})
  cursor[last] = value
}

function labelFor(path: string): string {
  return path.split('.').at(-1)!.replace(/([A-Z])/g, ' $1').toLowerCase()
}

// ── Overrides ─────────────────────────────────────────────────────────────────

const changed = computed(() =>
  Object.entries(values).filter(([path, value]) => value !== defaults[path]))

const overrides = computed(() => {
  const result: Record<string, any> = {}
  for (const [path, value] of changed.value) setPath(result, path, value)
  return result
})

const overridesJson = computed(() => JSON.stringify(overrides.value, null, 2))

function scheduleApply(): void {
  clearTimeout(applyTimer)
  applyTimer = setTimeout(() => gem?.setConfig(overrides.value), 120)
}

function resetAll(): void {
  for (const path of Object.keys(values)) values[path] = defaults[path]
  scheduleApply()
}

async function copyOverrides(): Promise<void> {
  await navigator.clipboard.writeText(overridesJson.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

function renderSeed(): void {
  gem?.update(seed.value.trim() || 'seedstone')
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  const { SeedstoneRenderer, defaultConfig } = await import('seedstone')

  for (const section of SECTIONS) {
    for (const knob of section.knobs) {
      const value = getPath(defaultConfig, knob.path) as number
      defaults[knob.path] = value
      values[knob.path]   = value
    }
  }
  loaded.value = true

  const size = containerRef.value!.clientWidth || 420
  gem = new SeedstoneRenderer(seed.value, {
    container:  containerRef.value!,
    width:      size,
    height:     size,
    background: null,
  })

  ro = new ResizeObserver(() => {
    const s = containerRef.value?.clientWidth
    if (gem && s) gem.resize(s, s)
  })
  ro.observe(containerRef.value!)
})

onBeforeUnmount(() => {
  clearTimeout(applyTimer)
  gem?.destroy()
  ro?.disconnect()
})
</script>

<template>
  <div class="config-page">

    <header class="header">
      <NuxtLink to="/" class="back-link">← seedstone</NuxtLink>
      <h1>Config lab</h1>
      <p class="sub">Tune the renderer live, then copy the overrides into <code>src/config.ts</code>.</p>
    </header>

    <div class="layout">

      <!-- ── Left: gem preview + output ──────────────────────────────────── -->
      <aside class="preview">
        <div ref="container" class="gem-box" />
        <div class="seed-row">
          <input
            v-model="seed"
            class="seed-input"
            placeholder="seed"
            autocomplete="off"
            spellcheck="false"
            @keydown.enter="renderSeed"
          />
          <button class="btn" @click="renderSeed">Render</button>
        </div>
        <div class="actions">
          <button class="btn ghost" :disabled="!changed.length" @click="resetAll">Reset</button>
          <button class="btn" :disabled="!changed.length" @click="copyOverrides">
            {{ copied ? 'Copied ✓' : `Copy ${changed.length} override${changed.length === 1 ? '' : 's'}` }}
          </button>
        </div>
        <pre v-if="changed.length" class="diff">{{ overridesJson }}</pre>
        <p v-else class="diff-empty">Move a slider — changed values show up here.</p>
      </aside>

      <!-- ── Right: knobs ─────────────────────────────────────────────────── -->
      <main v-if="loaded" class="knobs">
        <section v-for="section in SECTIONS" :key="section.title" class="group">
          <h2>{{ section.title }}</h2>
          <div
            v-for="knob in section.knobs"
            :key="knob.path"
            class="knob"
            :class="{ dirty: values[knob.path] !== defaults[knob.path] }"
          >
            <label :for="knob.path" :title="knob.path">{{ labelFor(knob.path) }}</label>
            <input
              :id="knob.path"
              v-model.number="values[knob.path]"
              type="range"
              :min="knob.min"
              :max="knob.max"
              :step="knob.step"
              @input="scheduleApply"
            />
            <input
              v-model.number="values[knob.path]"
              type="number"
              :min="knob.min"
              :max="knob.max"
              :step="knob.step"
              @input="scheduleApply"
            />
          </div>
        </section>
      </main>

    </div>
  </div>
</template>

<style scoped>
.config-page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.header { margin-bottom: 28px; }

.back-link {
  font-size: 0.8rem;
  color: var(--muted);
  text-decoration: none;
}
.back-link:hover { color: var(--accent); }

.header h1 {
  margin: 10px 0 6px;
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #f3e8ff, #c084fc 60%, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sub {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.4);
}
.sub code {
  font-family: 'Consolas', 'SF Mono', monospace;
  color: var(--accent);
}

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.layout {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
@media (min-width: 900px) {
  .layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    align-items: start;
  }
  .preview { position: sticky; top: 24px; }
}

/* ── Preview column ─────────────────────────────────────────────────────────── */
.preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gem-box {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: rgba(0,0,0,0.25);
}
.gem-box :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

.seed-row { display: flex; gap: 8px; }

.seed-input {
  flex: 1;
  min-width: 0;
  padding: 9px 13px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.06);
  color: var(--text);
  font-size: 0.9rem;
  outline: none;
}
.seed-input:focus { border-color: rgba(167,139,250,0.6); }

.btn {
  padding: 9px 16px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  color: #fff;
  white-space: nowrap;
}
.btn:hover:not(:disabled) { opacity: 0.88; }
.btn:disabled { opacity: 0.35; cursor: default; }
.btn.ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
}

.actions { display: flex; gap: 8px; }
.actions .btn { flex: 1; }

.diff {
  margin: 0;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(0,0,0,0.35);
  font-family: 'Consolas', 'SF Mono', monospace;
  font-size: 0.72rem;
  line-height: 1.55;
  color: #a5e8c8;
  max-height: 320px;
  overflow: auto;
  white-space: pre;
}
.diff-empty {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.25);
}

/* ── Knobs column ───────────────────────────────────────────────────────────── */
.knobs {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.group {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
}
.group h2 {
  margin: 0 0 14px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--muted);
}

.knob {
  display: grid;
  grid-template-columns: 170px 1fr 86px;
  align-items: center;
  gap: 12px;
  padding: 3px 0;
}
.knob label {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.knob.dirty label { color: var(--accent); }

.knob input[type='range'] {
  width: 100%;
  accent-color: #a78bfa;
}

.knob input[type='number'] {
  width: 100%;
  box-sizing: border-box;
  padding: 5px 8px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.05);
  color: var(--text);
  font-size: 0.76rem;
  font-family: 'Consolas', 'SF Mono', monospace;
  outline: none;
}
.knob input[type='number']:focus { border-color: rgba(167,139,250,0.6); }

@media (max-width: 560px) {
  .knob { grid-template-columns: 1fr 80px; }
  .knob label { grid-column: 1 / -1; }
}
</style>
