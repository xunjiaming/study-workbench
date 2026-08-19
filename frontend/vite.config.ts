import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: "/study-workbench/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "学习辅导工作台",
        short_name: "学习工作台",
        description: "小学生学习辅导计划工具",
        theme_color: "#111111",
        background_color: "#ffffff",
        display: "standalone",
        icons: [{ src: "favicon.svg", sizes: "192x192", type: "image/svg+xml" }],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,json}"] },
    }),
  ],
});
