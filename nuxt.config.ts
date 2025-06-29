// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  nitro: {
    experimental: {
      wasm: true,
    },
  },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxtjs/tailwindcss"],
  devtools: { enabled: true }
})
