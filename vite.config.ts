import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192x192.png", "pwa-512x512.png"],
      workbox: {
        // App shell, font and icons only. No runtime caching rule exists, so a
        // decoded scan can never enter the cache.
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
      },
      manifest: {
        name: "palang-ic",
        short_name: "palang-ic",
        description: "Add a JPN-style palang to MyKad copies, entirely in your browser.",
        theme_color: "#9B1C1C",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});
