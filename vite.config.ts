import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["mnm-icon.svg"],
      manifest: {
        name: "M&M Receive",
        short_name: "M&M Receive",
        description: "Track and receive your M&M parcels",
        theme_color: "#ea690c",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/receive",
        scope: "/",
        icons: [
          {
            src: "/mnm-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2,png,jpg}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  base: "/",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://backend.mandmservicescorp.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
});
