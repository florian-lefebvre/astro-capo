import { defineConfig } from "astro/config";
// import path from "node:path";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);

// https://astro.build/config
export default defineConfig({
  vite: {
    // optimizeDeps: {
    //   link: ["astro-capo"],
    // },
    // alias: {
    //   "astro-capo": "/@linked/astro-capo/index.ts",
    //   "/@linked/astro-capo/": path.resolve(
    //     require.resolve("astro-capo/package.json"),
    //     "../src"
    //   ),
    // },
  },
});
