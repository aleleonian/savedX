import { defineConfig, mergeConfig } from 'vite';
import { getBuildConfig, external, pluginHotRestart } from './vite.base.config.mjs';

export default defineConfig((env) => mergeConfig(getBuildConfig(env), {
  build: {
    sourcemap: true,
    lib: {
      entry: "src/preload.mjs",
      formats: ["es"],
    },
    rollupOptions: {
      external,
      input: env.forgeConfigSelf.entry,
      output: {
        format: 'es',
        inlineDynamicImports: true,
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name].mjs',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [pluginHotRestart()],
}));
