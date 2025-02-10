import { defineConfig, mergeConfig } from 'vite';
import { getBuildConfig, getBuildDefine, external, pluginHotRestart } from './vite.base.config.mjs';

export default defineConfig((env) => mergeConfig(getBuildConfig(env), {
  build: {
    sourcemap: true,
    lib: {
      entry: env.forgeConfigSelf.entry,
      fileName: () => 'main.mjs',
      formats: ['es'],
    },
    rollupOptions: { external },
  },
  plugins: [pluginHotRestart()],
  root: process.cwd(),
  server: {
    port: 5173,
    strictPort: true,
  },
  define: getBuildDefine(env),
}));
