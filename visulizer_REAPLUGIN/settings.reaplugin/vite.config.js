import { defineConfig } from "vite";
import { resolve } from "path";

const outDir = resolve(__dirname, "dist", "settings.reaplugin");

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/plugin.js"),
      name: "createPlugin",
      formats: ["iife"],
      fileName: () => "plugin.js",
    },
    outDir,
    emptyOutDir: false,
    minify: false,
  },
});
