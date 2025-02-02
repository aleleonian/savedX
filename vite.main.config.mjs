import { defineConfig, mergeConfig } from 'vite';
import {
  getBuildConfig,
  getBuildDefine,
  external,
  pluginHotRestart,
} from './vite.base.config.mjs';

export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'build'>} */
  const forgeEnv = env;
  const { forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);

  const config = {
    build: {
      sourcemap: "inline",
      lib: {
        entry: forgeConfigSelf.entry,
        fileName: () => 'main.mjs',  // 🔥 Ensure output is main.mjs
        formats: ['es'],             // 🔥 Make sure it's an ES module
      },
      rollupOptions: {
        external,
      },
    },
    plugins: [pluginHotRestart('restart')],
    define,
    resolve: {
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});
