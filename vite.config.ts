import { defineConfig } from "vite";

// base: "./" keeps every asset reference relative so the built site works when
// served from any subpath (e.g. apps.charliekrug.com/mitosis-lab), not just root.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2020",
    // Two HTML entry points sharing one bundle: the simulator at the root and
    // the marketing landing page under site/, so both ship from one `dist/`.
    rollupOptions: {
      input: {
        app: "index.html",
        site: "site/index.html",
      },
    },
  },
});
