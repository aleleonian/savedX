import { defineConfig, mergeConfig } from 'vite';
import {
  getBuildConfig,
  external,
  pluginHotRestart,
} from './vite.base.config.mjs';

// https://vitejs.dev/config
export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'build'>} */
  const forgeEnv = env;
  const { forgeConfigSelf } = forgeEnv;
  /** @type {import('vite').UserConfig} */
  const config = {
    build: {
      lib: {
        entry: "src/preload.mjs", // Ensure this points to the right file
        formats: ["es"], // Only generate ESM!
      },
      rollupOptions: {
        external,
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry,
        output: {
          format: 'es',
          // It should not be split chunks.
          inlineDynamicImports: true,
          entryFileNames: '[name].mjs',
          chunkFileNames: '[name].mjs',
          assetFileNames: '[name].[ext]',
        },
      },
    },
    plugins: [pluginHotRestart('reload')],
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});
