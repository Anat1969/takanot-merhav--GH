import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  // GitHub Pages מגיש את האתר תחת שם הריפו
  base: '/takanot-merhav--GH/',
  plugins: [react()],
  // תצוגה מקדימה כקובץ HTML יחיד: גופנים ונכסים מוטמעים בקוד
  build:
    mode === 'preview-embed'
      ? { assetsInlineLimit: 100_000_000, modulePreload: false, rollupOptions: { output: { inlineDynamicImports: true } } }
      : {},
  test: {
    environment: 'jsdom',
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
}));
