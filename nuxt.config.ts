// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-charts'],
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    '~/assets/css/app.css',
  ],
  app: {
    baseURL: import.meta.env.PROD ? '/diabetecat/' : '/',
    head: {
      meta: [
        { name: 'theme-color', content: '#2563eb' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
      ],
    },
  },

  nitro: {
    preset: 'github_pages'
  }
})
