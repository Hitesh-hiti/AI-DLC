import { defineConfig } from 'vitest/config'
import istanbul from 'vite-plugin-istanbul'

export default defineConfig({
  // 🌐 1. VITE SERVER & BUILDER CONFIGURATION (For Playwright E2E Instrumentation)
  plugins: [
    // Only instrument the code if explicitly running coverage commands
    ...(process.env.NODE_ENV === 'test' || process.env.VITE_COVERAGE === 'true'
      ? [
          istanbul({
            include: 'src/**/*',
            exclude: ['node_modules/**', 'test/**', 'reports/**'],
            extension: ['.js', '.ts', '.jsx', '.tsx'],
            requireEnv: false, // Allows tracking during raw local runs
            forceBuildInstrument: true, // Guarantees coverage injection in local preview bundles
          }),
        ]
      : []),
  ],
  build: {
    // Generates source maps so E2E coverage tracks back to your exact TypeScript lines
    sourcemap: true, 
  },

  // 🧪 2. VITEST TEST RUNNER CONFIGURATION (For Unit Scenarios)
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
      reportOnFailure: true,
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      }
    },
  },
})
