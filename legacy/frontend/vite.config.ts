import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import devtoolsJson from "vite-plugin-devtools-json";

// https://vitejs.dev/config/
export default defineConfig({
  // Đường dẫn tương đối để chạy được ở thư mục con (GitHub Pages); định tuyến dùng hash nên không cần cấu hình máy chủ.
  base: "./",
  plugins: [
    react(),
    devtoolsJson(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
  },
  server: {
    host: true,
    port: 3030,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const normalizedId = id.replace(/\\/g, "/");
          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/")
          ) {
            return "vendor-react";
          }
          if (normalizedId.includes("/node_modules/recharts/")) {
            return "vendor-charts";
          }
          if (normalizedId.includes("/node_modules/lucide-react/")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
});
