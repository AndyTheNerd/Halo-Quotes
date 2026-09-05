import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Scope to the website's own tests. Without this the glob also picks up
    // api-worker/, whose tests expect the node environment, not jsdom.
    include: ['__tests__/**/*.test.js'],
  },
});
