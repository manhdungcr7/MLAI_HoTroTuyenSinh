// CMS quản trị là một ứng dụng Vite riêng, dùng chung node_modules gốc.
// "@cms" trỏ vào cms/src; "@" trỏ vào src của ứng dụng học sinh (chỉ dùng cho mã thuần dùng chung: kiểu, dữ liệu, kiểm tra).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Chạy thử trên máy: `npm run cms:dev` chuyển /api sang máy chủ Pages Functions đang chạy ở CMS_API_TARGET (mặc định cổng 8788,
// bật bằng `wrangler pages dev`). Biến CMS_GIA_DANH (email) chỉ có tác dụng khi máy chủ có GIA_DANH_DEV=1 và chạy ở localhost.
const apiTarget = process.env.CMS_API_TARGET ?? "http://127.0.0.1:8788";
const giaDanh = process.env.CMS_GIA_DANH;

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@cms": fileURLToPath(new URL("./src", import.meta.url)),
      "@": fileURLToPath(new URL("../src", import.meta.url)),
    },
  },
  server: { proxy: { "/api": { target: apiTarget, changeOrigin: false, ...(giaDanh && { headers: { "X-Gia-Danh": giaDanh } }) } } },
  build: { outDir: "dist", emptyOutDir: true },
});
