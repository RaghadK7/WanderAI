// cypress.config.js - النسخة الصحيحة لـ ES Modules
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshot: true,
    setupNodeEvents(on, config) {
      // إعدادات إضافية هنا إذا احتجتِ
    },
  },
})