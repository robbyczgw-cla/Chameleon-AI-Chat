import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import { viteStaticCopy } from "vite-plugin-static-copy"

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "manifest-firefox.json",
          dest: ".",
          rename: "manifest.json",
        },
        {
          src: "../public/icon-*.png",
          dest: "icons",
        },
      ],
    }),
  ],
  build: {
    outDir: "dist/firefox",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/inject.ts"),
        popup: resolve(__dirname, "src/popup/index.html"),
        // No sidepanel for Firefox - uses larger popup instead
        options: resolve(__dirname, "src/options/index.html"),
      },
      output: {
        entryFileNames: "[name]/index.js",
        chunkFileNames: "shared/[name].js",
        assetFileNames: "[name]/[name].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env.BROWSER": JSON.stringify("firefox"),
  },
})
