<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// ── Emits ─────────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  pick: [{ seed: string; overrides: Record<string, unknown> }]
}>()

// ── Types ─────────────────────────────────────────────────────────────────────
interface GalleryItem {
  seed:      string
  label:     string
  overrides: Record<string, unknown>
}

// ── State ─────────────────────────────────────────────────────────────────────
const SIZE  = 180
const BG    = 0x07080f
const items = ref<GalleryItem[]>([])

// Gems keyed by cut name so we can destroy them on unmount
const gems = new Map<string, unknown>()

// ── Mount / unmount ───────────────────────────────────────────────────────────
onMounted(async () => {
  // Dynamic import keeps lumina-gem (Three.js) out of the SSR bundle entirely
  const { LuminaRenderer, listCuts } = await import('lumina-gem')

  items.value = (listCuts() as string[]).map((cut) => ({
    seed:      cut,
    label:     cut,
    overrides: { cut },
  }))

  // Wait for Vue to render the list, then mount each gem
  await nextTick()
  document.querySelectorAll<HTMLDivElement>('[data-gem-cut]').forEach((el) => {
    const cut  = el.dataset.gemCut!
    const item = items.value.find((i) => i.label === cut)
    if (!item) return
    gems.get(cut)?.destroy()
    gems.set(cut, new LuminaRenderer(item.seed, item.overrides, {
      container:  el,
      width:      SIZE,
      height:     SIZE,
      background: BG,
    }))
  })
})

onBeforeUnmount(() => {
  gems.forEach((g: any) => g?.destroy())
  gems.clear()
})
</script>

<template>
  <section class="gallery-section">
    <div class="section-title">Cut showcase</div>
    <div class="gallery-grid">
      <div
        v-for="item in items"
        :key="item.label"
        class="gallery-item"
        :title="`View ${item.label}`"
        @click="emit('pick', { seed: item.seed, overrides: item.overrides })"
      >
        <div
          class="gallery-gem-wrap"
          :data-gem-cut="item.label"
        />
        <div class="gallery-label">{{ item.label }}</div>
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
