// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

   css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#07080f' },
      ],
      link: [
        // favicon is set dynamically by plugins/gem-favicon.client.ts
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
      ],
    },
  },

  // lumina-gem uses Three.js + WebGL — keep it client-side only
  // (components that use it are already wrapped in <ClientOnly>)
  vite: {
    resolve: {
      alias: {
        // Point directly at the dist file so Vite watches it and picks up
        // rollup rebuilds immediately, instead of using a stale pre-bundle.
        'lumina-gem': new URL('../dist/lumina-gem.esm.js', import.meta.url).pathname,
      },
    },
    optimizeDeps: {
      exclude: ['lumina-gem'],
    },
  },
})
