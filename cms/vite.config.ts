// CMS quản trị là một ứng dụng Vite riêng, dùng chung node_modules gốc.
// "@cms" trỏ vào cms/src; "@" trỏ vào src của ứng dụng học sinh (chỉ dùng cho mã thuần dùng chung: kiểu, dữ liệu, kiểm tra).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@cms": fileURLToPath(new URL("./src", import.meta.url)),
      "@": fileURLToPath(new URL("../src", import.meta.url)),
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
