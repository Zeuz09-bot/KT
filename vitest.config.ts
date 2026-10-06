import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environmentMatchGlobs: [
      ['tests/unit/**/*.test.tsx', 'jsdom'],
      ['tests/unit/**/*.test.ts', 'node'],
    ],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
