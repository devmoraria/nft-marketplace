import { defineConfig, devices } from '@playwright/test'

// Guia, seção 13. Para o teste final (build publicado), troque o webServer.command por:
//   'npm run build && npm run preview -- --port 4173'   (exige VITE_ENABLE_MOCKS=true no .env.production)
export default defineConfig({
  testDir: 'tests/e2e',
  reporter: [['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure', serviceWorkers: 'allow' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    env: { VITE_ENABLE_MOCKS: 'true' },
  },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
})
