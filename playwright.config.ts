import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    ...devices['Pixel 7'],
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    // Keep mocked APIs on a separate path from the SPA and never call a live server.
    env: { VITE_API_BASE_URL: '/api/v1' },
    url: 'http://localhost:4173',
    stdout: 'pipe',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
  },
});
