import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import { getBuildConfig, getBuildDefine, external, pluginHotRestart } from './vite.base.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig((env) =>
  mergeConfig(getBuildConfig(env), {
    build: {
      sourcemap: true,
      lib: {
        entry: env.forgeConfigSelf.entry,
        fileName: () => 'main.mjs',
        formats: ['es'],
      },
      rollupOptions: {
        external: (id) => {
          // Only mark electron and node built-ins as external
          return external.includes(id) && id !== 'xbot-js';
        },
      },
    },
    resolve: {
      alias: {
        // 👇 force Vite to treat xbot-js as a local file and bundle it
        'xbot-js': path.resolve(__dirname, 'node_modules/xbot-js/dist/cjs/index.js'),
      },
      preserveSymlinks: false,
    },
    plugins: [pluginHotRestart()],
    root: process.cwd(),
    server: {
      port: 5173,
      strictPort: true,
    },
    define: getBuildDefine(env),
  })
);
