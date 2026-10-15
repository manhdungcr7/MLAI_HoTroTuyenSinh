import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";


import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://127.0.0.1:8790", "/snapshots": "http://127.0.0.1:8790" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
