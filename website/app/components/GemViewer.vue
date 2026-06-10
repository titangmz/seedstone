<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'

// lumina-gem is loaded as a peer — either via npm link during dev or the built
// dist when deployed.  We import it as an ES module.
// @ts-ignore — types live in the library root dist/
import { LuminaRenderer } from 'lumina-gem'

// ── Props ─────────────────────────────────────────────────────────────────────
const props = defineProps<{ seed: string }>()

// ── Emits ─────────────────────────────────────────────────────────────────────
const emit = defineEmits<{ dna: [dna: Record<string, unknown>] }>()

// ── State ─────────────────────────────────────────────────────────────────────
const containerRef = useTemplateRef<HTMLDivElement>('container')
const loading      = ref(true)

let gem: InstanceType<typeof LuminaRenderer> | null = null
let ro: ResizeObserver | null = null

function mount(seed: string) {
  if (!containerRef.value) return
  gem?.destroy()
  gem = null
  loading.value = true

  const size = containerRef.value.clientWidth || 500
  requestAnimationFrame(() => {
    gem = new LuminaRenderer(seed, {
      container:  containerRef.value!,
      width:      size,
      height:     size,
      background: null,
    })
    loading.value = false
    emit('dna', gem.dna as Record<string, unknown>)
  })
}

onMounted(() => {
  mount(props.seed)

  ro = new ResizeObserver(() => {
    if (gem && containerRef.value) {
      const s = containerRef.value.clientWidth
      gem.resize(s, s)
    }
  })
  ro.observe(containerRef.value!)
})

watch(() => props.seed, (s) => mount(s))

onBeforeUnmount(() => {
  gem?.destroy()
  ro?.disconnect()
})
</script>

<template>
  <div class="gem-wrap">
    <div ref="container" class="gem-container">
      <div v-if="loading" class="spinner" />
    </div>
  </div>
</template>

<style scoped>
.gem-wrap {
  position: relative;
  width: min(500px, 90vw);
  height: min(500px, 90vw);
}

/* Glow ring behind gem */
.gem-wrap::before {
  content: '';
  position: absolute;
  inset: -30px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(167,139,250,0.18) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%       { opacity: 1.0; transform: scale(1.06); }
}

.gem-container {
  width: 100%;
  height: 100%;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}

/* Loading spinner */
.spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}
.spinner::after {
  content: '';
  width: 36px;
  height: 36px;
  border: 3px solid rgba(167,139,250,0.25);
  border-top-color: #ce93d8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
