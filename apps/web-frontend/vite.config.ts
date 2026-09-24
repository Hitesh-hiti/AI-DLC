import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'vmThreads',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    reporters: [
      'default',
      [
        'html',
        {
          outputDir: './reports/vitest/ui-report',
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
      provider: 'istanbul', 
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './reports/vitest/coverage-report',
      reportOnFailure: true
    },
  },
})