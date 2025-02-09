import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config.mjs';

// https://vitejs.dev/config
export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'renderer'>} */
  const forgeEnv = env;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  /** @type {import('vite').UserConfig} */
  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
      sourcemap: true,
      minify: false,
    },
    server: {
      sourcemap: true,
      port: 5173,
      strictPort: true,
      hmr: true,       // 🔥 Enable Hot Module Reloading
      open: false,
      watch: { usePolling: true },
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  };
});
