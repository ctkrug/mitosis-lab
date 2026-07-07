import { defineConfig } from "vite";

// base: "./" keeps every asset reference relative so the built site works when
// served from any subpath (e.g. apps.charliekrug.com/mitosis-lab), not just root.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2020",
  },
});
