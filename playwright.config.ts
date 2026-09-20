import { defineConfig, devices } from '@playwright/test';

// Pruebas E2E reales: navegador Chromium + servidor de Vite + backend en VITE_API_BASE_URL
// (por defecto http://localhost:8000). Ejecutar con: npm run test:e2e
const PORT = 5173;

export default defineConfig({
  testDir: './e2e',
  // Se nombran *.e2e.ts (no *.spec.ts) para que vitest no los recoja en `npm test`
  testMatch: '**/*.e2e.ts',
  // Todos los tests comparten un mismo backend: se ejecutan de a uno
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
