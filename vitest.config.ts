import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['tests/unit/**/*.test.tsx', 'jsdom'],
      ['tests/unit/**/*.test.ts', 'node'],
    ],
    // Single fork: one worker process avoids concurrent child OOM crashes.
    // Safe to load setupFiles here since there is only one worker.
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        execArgv: ['--max-old-space-size=512'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

