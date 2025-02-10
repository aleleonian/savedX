import { builtinModules } from "node:module";
import pkg from "./package.json";

const builtins = ["electron", ...builtinModules.map(m => [m, `node:${m}`]).flat()];
const external = [...builtins, ...Object.keys(pkg.dependencies || {})];

/** @type {(env: import('vite').ConfigEnv) => import('vite').UserConfig} */
export const getBuildConfig = (env) => ({
  root: env.root,
  mode: env.mode,
  build: {
    emptyOutDir: false,
    outDir: ".vite/build",
    watch: env.command === "serve" ? {} : null,
    minify: env.command === "build",
    sourcemap: true,
  },
  clearScreen: false,
});

export const getBuildDefine = (env) => ({
  VITE_DEV_SERVER_URL: env.command === "serve"
    ? JSON.stringify(process.env.VITE_DEV_SERVER_URL)
    : undefined,
});

export const pluginExposeRenderer = (name) => ({
  name: "@electron-forge/plugin-vite:expose-renderer",
  configureServer(server) {
    process.viteDevServers ??= {};
    process.viteDevServers[name] = server;

    server.httpServer?.once("listening", () => {
      const addressInfo = server.httpServer?.address();
      process.env.VITE_DEV_SERVER_URL = `http://localhost:${addressInfo?.port}`;
    });
  },
});

export const pluginHotRestart = () => ({
  name: "@electron-forge/plugin-vite:hot-restart",
  closeBundle() {
    for (const server of Object.values(process.viteDevServers || {})) {
      server.ws.send({ type: "full-reload" });
    }
  },
});

export { external };
