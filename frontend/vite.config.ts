import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/study-workbench/app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        id: "/study-workbench/app/",
        name: "学习辅导工作台",
        short_name: "学习工作台",
        description: "小学生学习辅导计划工具",
        lang: "zh-CN",
        dir: "ltr",
        theme_color: "#ff6b9d",
        background_color: "#fff5f9",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        start_url: "/study-workbench/app/",
        scope: "/study-workbench/app/",
        categories: ["education", "kids"],
        prefer_related_applications: false,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,json,png}"] },
    }),
  ],
});
