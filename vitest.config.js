import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [path.join(__dirname, 'tests', 'setup.js')],
    include: ['tests/**/*.test.js'],
    globals: true,
  },
});
