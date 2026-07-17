// SPDX-License-Identifier: GPL-3.0-or-later
import { defineConfig } from 'vitest/config'
import path from 'path'
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
})
