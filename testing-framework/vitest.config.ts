/**
 * Vitest Configuration for TravelPlatform Test Automation
 * 
 * Configured for:
 * - Jest-compatible API assertions
 * - Supertest HTTP testing
 * - Structured logging support
 * - Coverage reporting
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test timeout (30 seconds)
    testTimeout: 30000,

    // Hook timeout
    hookTimeout: 30000,

    // Test isolation
    isolate: true,

    // Reporters
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test-results/',
        '**/*.test.ts',
        '**/__fixtures__/**'
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },

    // Test files pattern
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'build', '.idea', '.git'],

    // Globals (avoid needing imports)
    globals: true,

    // Threads
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Setup files
    setupFiles: [],

    // Deps inline (for monorepos)
    deps: {
      inline: []
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@client': path.resolve(__dirname, './api/clients'),
      '@fixtures': path.resolve(__dirname, './api/__fixtures__'),
      '@constants': path.resolve(__dirname, './shared/constants'),
      '@logger': path.resolve(__dirname, './shared/logger')
    }
  }
});
