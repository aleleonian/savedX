import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config.mjs';

export default defineConfig((env) => ({
  root: env.root,
  mode: env.mode,
  base: './',
  build: {
    outDir: `.vite/renderer/${env.forgeConfigSelf.name ?? ''}`,
    sourcemap: true,
    minify: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: true,
    open: false,
    watch: { usePolling: true },
  },
  plugins: [pluginExposeRenderer(env.forgeConfigSelf.name ?? '')],
  resolve: { preserveSymlinks: true },
  clearScreen: false,
}));
