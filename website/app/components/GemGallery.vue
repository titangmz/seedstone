<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps<{ count?: number }>()
const emit  = defineEmits<{
  pick: [{ seed: string; overrides: Record<string, unknown> }]
}>()

interface GalleryItem {
  seed:      string
  label:     string
  overrides: Record<string, unknown>
}

const BG         = 0x07080f
const STAGGER_MS = 80

const items      = ref<GalleryItem[]>([])
const gems       = new Map<string, unknown>()
let ioObs: IntersectionObserver | null = null
let roObs: ResizeObserver | null = null

onMounted(async () => {
  const { LuminaRenderer, listCuts } = await import('lumina-gem')

  const cuts    = listCuts() as string[]
  const visible = props.count != null ? cuts.slice(0, props.count) : cuts
  items.value   = visible.map((cut) => ({ seed: cut, label: cut, overrides: { cut } }))

  await nextTick()

  // Pause/play gems as they scroll in and out of view
  ioObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const gem = gems.get((entry.target as HTMLDivElement).dataset.gemCut!) as any
        if (!gem) return
        entry.isIntersecting ? gem.play() : gem.pause()
      })
    },
    { threshold: 0.1 }
  )

  // Keep canvas resolution in sync with its display size
  roObs = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const el  = entry.target as HTMLDivElement
      const gem = gems.get(el.dataset.gemCut!) as any
      if (!gem) return
      const s = el.clientWidth
      gem.resize(s, s)
    })
  })

  const els = Array.from(document.querySelectorAll<HTMLDivElement>('[data-gem-cut]'))
  els.forEach((el, i) => {
    setTimeout(() => {
      const cut  = el.dataset.gemCut!
      const item = items.value.find((x) => x.label === cut)
      if (!item || !el.isConnected) return

      ;(gems.get(cut) as any)?.destroy?.()

      // Use the element's actual rendered width so the canvas is never upscaled
      const s = el.clientWidth || 180
      gems.set(cut, new LuminaRenderer(item.seed, item.overrides, {
        container:  el,
        width:      s,
        height:     s,
        background: BG,
        targetFPS:  24,
      }))

      ioObs!.observe(el)
      roObs!.observe(el)
    }, i * STAGGER_MS)
  })
})

onBeforeUnmount(() => {
  ioObs?.disconnect()
  roObs?.disconnect()
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
        <div class="gallery-gem-wrap" :data-gem-cut="item.label" />
        <div class="gallery-label">{{ item.label }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.gallery-section {
  width: 100%;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
@media (min-width: 480px) {
  .gallery-grid { grid-template-columns: repeat(4, 1fr); }
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
</style>
