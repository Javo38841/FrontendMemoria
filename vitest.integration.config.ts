import { defineConfig } from 'vitest/config'

// Pruebas de integración REALES contra el backend (no usa mocks).
// Base URL: VITE_API_BASE_URL (por defecto http://localhost:8000), la misma que usa la app.
// Ejecutar con: npm run test:integration
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    // los archivos comparten el mismo backend, así que se ejecutan de a uno
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
})
