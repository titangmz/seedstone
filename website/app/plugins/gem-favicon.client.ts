/**
 * gem-favicon.client.ts
 * Renders a live rotating gem and uses it as the page favicon.
 * Watches the global useActiveSeed() state — when the user changes the gem
 * on the page, the favicon updates to match.
 */

// @ts-ignore — types live in the library root
import { LuminaRenderer } from 'lumina-gem'
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const SIZE       = 64
  const activeSeed = useActiveSeed()

  // ── Offscreen wrapper div (never added to DOM) ──────────────────────────────
  const wrapper = document.createElement('div')
  wrapper.style.width  = `${SIZE}px`
  wrapper.style.height = `${SIZE}px`

  // ── Favicon <link> element ──────────────────────────────────────────────────
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  // ── 2D composite canvas ─────────────────────────────────────────────────────
  // WebGL pre-multiplied alpha must be re-composited via drawImage onto a 2D
  // canvas to get correct transparent PNG output from toDataURL.
  const composite = document.createElement('canvas')
  composite.width  = SIZE
  composite.height = SIZE
  const ctx = composite.getContext('2d')!

  // ── Gem instance management ─────────────────────────────────────────────────
  let gem: InstanceType<typeof LuminaRenderer> | null = null
  let gemCanvas: HTMLCanvasElement | null = null
  let rafId = 0

  function mountGem(seed: string) {
    // Tear down previous instance
    cancelAnimationFrame(rafId)
    gem?.destroy()
    wrapper.innerHTML = ''

    gem = new LuminaRenderer(seed, {
      container:  wrapper,
      width:      SIZE,
      height:     SIZE,
      background: null,
    })

    gemCanvas = wrapper.querySelector('canvas')
    if (!gemCanvas) return

    function tick() {
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.drawImage(gemCanvas!, 0, 0, SIZE, SIZE)
      link!.type = 'image/png'
      link!.href = composite.toDataURL('image/png')
      rafId = requestAnimationFrame(tick)
    }
    tick()
  }

  // ── Boot + reactivity ───────────────────────────────────────────────────────
  mountGem(activeSeed.value)
  watch(activeSeed, (seed) => mountGem(seed))

  // ── Cleanup on page unload ──────────────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId)
    gem?.destroy()
  })
})
