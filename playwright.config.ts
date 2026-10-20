// SPDX-License-Identifier: GPL-3.0-or-later
import { defineConfig, devices } from '@playwright/test'

export const E2E_ADMIN_PATH = 'e2e-secret-panel-01'
const PORT = 3100

/**
 * End-to-end smoke + accessibility checks against a production build
 * (`npm run build` first). No real services: without DATABASE_URL / Turnstile /
 * Drive the pages must still render and fail politely, which is part of what
 * these tests check.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { ADMIN_PATH: E2E_ADMIN_PATH, ADMIN_SESSION_SECRET: 'e2e-session-secret-that-is-long-enough' },
  },
})
