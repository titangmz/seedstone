<script setup lang="ts">
// @ts-ignore
import { LuminaRenderer } from 'lumina-gem'
import { onMounted, onBeforeUnmount, useTemplateRef } from 'vue'

// ── Props & Emits ─────────────────────────────────────────────────────────────
const props = defineProps<{ seeds: string[] }>()
const emit  = defineEmits<{ pick: [seed: string] }>()

// ── Per-item gem lifecycle ────────────────────────────────────────────────────
const SIZE = 180
const BG   = 0x07080f

interface GemEntry { gem: InstanceType<typeof LuminaRenderer> | null }
const entries: GemEntry[] = props.seeds.map(() => ({ gem: null }))

function mountGem(el: HTMLDivElement, index: number) {
  entries[index].gem?.destroy()
  entries[index].gem = new LuminaRenderer(props.seeds[index], {
    container:  el,
    width:      SIZE,
    height:     SIZE,
    background: BG,
  })
}

onBeforeUnmount(() => {
  entries.forEach(e => e.gem?.destroy())
})
</script>

<template>
  <section class="gallery-section">
    <div class="section-title">Gallery — click to render</div>
    <div class="gallery-grid">
      <div
        v-for="(seed, i) in seeds"
        :key="seed"
        class="gallery-item"
        :title="`Render &quot;${seed}&quot;`"
        @click="emit('pick', seed)"
      >
        <div
          class="gallery-gem-wrap"
          :ref="(el) => el && mountGem(el as HTMLDivElement, i)"
        />
        <div class="gallery-label">{{ seed }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.gallery-section {
  width: 100%;
  max-width: 900px;
  margin-top: 64px;
}

.section-title {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7986cb;
  margin-bottom: 24px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
}

.gallery-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}
.gallery-item:hover { transform: translateY(-4px); }

.gallery-gem-wrap {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.3);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

.gallery-gem-wrap :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.gallery-label {
  font-size: 0.78rem;
  color: #7986cb;
  text-align: center;
  font-family: 'Consolas', 'SF Mono', monospace;
}

@media (max-width: 480px) {
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
