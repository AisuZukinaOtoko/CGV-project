import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.wav", "**/*.json", "**/*.jpg"],
});
