import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,

    setupFiles: ['./test/setup.ts'],

    include: ['**/*.test.{ts,tsx}'],

    reporters: [
      'default',
      [
        'html',
        {
          outputDir: './reports/vitest',
        },
      ],
      [
        'junit',
        {
          outputFile: './reports/vitest/junit.xml',
        },
      ],
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './reports/vitest/coverage',
    },
  },
})