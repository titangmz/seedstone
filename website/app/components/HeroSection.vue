<script setup lang="ts">
import { ref } from 'vue'
import type { SeedstoneConfig } from 'seedstone'

const inputValue   = ref('')
const activeSeed   = ref('SEE')
const gemConfig    = ref<SeedstoneConfig | null>(null)
const inputFocused = ref(false)

const QUICK_PICKS = ['@satoshi', '0x71C7…976F', 'Orion-7', 'Stripe Inc', 'DOC-99812']

function onInput() { activeSeed.value = inputValue.value.trim() || 'seedstone' }
function onQuickPick(val: string) { inputValue.value = val; activeSeed.value = val }

defineExpose({
  focusInput() {
    document.getElementById('forge-input')?.focus()
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
  },
})
</script>

<template>
  <header id="hero" class="hero">
    <div class="wrap">
      <div class="hero-grid">

        <!-- Left: copy + forge field -->
        <div class="hero-copy">
          <span class="eyebrow">Deterministic visual identity</span>

          <h1 class="h1">
            Give any string<br>
            its own <em>gemstone</em>.
          </h1>

          <p class="lede">
            Type a username, wallet, company, or AI agent — Seedstone forges a unique 3D gem as its
            <strong>permanent visual identity</strong>. The same input always crystallizes the exact same stone.
          </p>

          <div class="forge">
            <div class="field" :class="{ focused: inputFocused }">
              <svg class="field-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="17" x2="11" y2="17"/>
              </svg>
              <input
                id="forge-input"
                v-model="inputValue"
                type="text"
                placeholder="Enter a name, wallet, company, or agent…"
                autocomplete="off"
                spellcheck="false"
                @input="onInput"
                @keydown.enter="onInput"
                @focus="inputFocused = true"
                @blur="inputFocused = false"
              />
            </div>

            <div class="examples">
              <span class="ex-lbl">Try</span>
              <button
                v-for="val in QUICK_PICKS"
                :key="val"
                class="chip"
                @click="onQuickPick(val)"
              >{{ val }}</button>
            </div>
          </div>
        </div>

        <!-- Right: gem stage + genome panel -->
        <div class="hero-right">
          <div class="stage">
            <ClientOnly>
              <GemViewer :seed="activeSeed" @config="(c) => (gemConfig = c)" />
            </ClientOnly>
          </div>
          <GemGenome :config="gemConfig" :seed="activeSeed" />
        </div>

      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 108px 0 72px;
  position: relative;
  z-index: 1;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 56px;
  align-items: center;
}
@media (min-width: 960px) {
  .hero-grid { grid-template-columns: 1.05fr 1.1fr; gap: 60px; }
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.h1 {
  font-size: clamp(36px, 4.2vw, 54px);
  line-height: 1.13;
  letter-spacing: -0.03em;
  font-weight: 600;
  margin: 26px 0 0;
  color: var(--text);
}
.h1 em {
  font-family: 'Instrument Serif', Georgia, serif;
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.01em;
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.lede {
  font-size: 17px;
  line-height: 1.65;
  color: var(--text-2);
  margin: 26px 0 0;
  max-width: 28em;
}
.lede strong { color: var(--text); font-weight: 500; }

.forge { margin-top: 38px; }

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  border: 1px solid var(--line-2);
  border-radius: 13px;
  padding: 6px 14px;
  transition: border-color .25s, box-shadow .25s;
}
.field.focused {
  border-color: oklch(0.7 0.15 290 / .55);
  box-shadow: 0 0 0 4px oklch(0.7 0.15 290 / .09);
}
.field-icon { flex-shrink: 0; color: #67647a; }

.field input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 14.5px;
  letter-spacing: -0.01em;
  min-width: 0;
  padding: 4px 0;
}
.field input::placeholder { color: #67647a; }

.examples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
}
.ex-lbl {
  font-size: 12px;
  color: #67647a;
  margin-right: 2px;
}
.chip {
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: oklch(0.10 0.01 280 / .5);
  transition: all .18s;
}
.chip:hover {
  border-color: var(--line-2);
  color: #fff;
  background: var(--panel-2);
  transform: translateY(-1px);
}

.hero-right {
  display: flex;
  align-items: center;
  gap: 28px;
}
@media (max-width: 640px) { .hero-right { flex-direction: column; } }

.stage {
  flex: 1;
  min-width: 220px;
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 46%, oklch(0.6 0.16 290 / .38), oklch(0.5 0.14 265 / .12) 46%, transparent 70%);
  filter: blur(8px);
  z-index: 0;
  pointer-events: none;
}
.stage :deep(.gem-wrap) {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}
.stage :deep(.gem-wrap::before) { display: none; }
.stage :deep(.gem-container) {
  border-radius: 0;
  overflow: visible;
}
</style>
