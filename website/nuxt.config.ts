// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@vercel/speed-insights/nuxt', '@vercel/analytics'],

  css: ['~/assets/css/main.css'],

  // Static site generation — all Three.js content is <ClientOnly> so there
  // is nothing to render server-side. The output lands in .output/public/.
  nitro: {
    preset: 'static',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#07080f' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
      ],
    },
  },

  // seedstone uses Three.js + WebGL — keep it client-side only.
  // The alias points straight at the ESM dist so Vite never tries to
  // pre-bundle it (which would break the dynamic import() pattern for SSR).
  vite: {
    resolve: {
      alias: {
        'seedstone': new URL('../dist/seedstone.esm.js', import.meta.url).pathname,
      },
    },
    optimizeDeps: {
      exclude: ['seedstone'],
    },
  },
})
