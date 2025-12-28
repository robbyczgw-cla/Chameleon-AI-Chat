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
          src: "../public/icon-192.png",
          dest: "icons",
        },
        {
          src: "../public/icon-512.png",
          dest: "icons",
        },
        {
          src: "src/content/styles.css",
          dest: "content",
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
        options: resolve(__dirname, "src/options/index.html"),
      },
      output: {
        entryFileNames: "[name]/index.js",
        chunkFileNames: "shared/[name].js",
        assetFileNames: (assetInfo) => {
          // Keep CSS in the right folders
          if (assetInfo.name?.endsWith(".css")) {
            return "[name]/[name][extname]"
          }
          return "assets/[name][extname]"
        },
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
