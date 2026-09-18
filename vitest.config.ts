import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

// Unit tests for pure commerce logic. Kept separate from vite.config.ts so
// the Hydrogen/Oxygen plugins don't load in the test runner.
export default defineConfig({
  resolve: {
    alias: {'~': fileURLToPath(new URL('./app', import.meta.url))},
  },
  test: {
    include: ['app/**/*.test.ts'],
    environment: 'node',
  },
});
