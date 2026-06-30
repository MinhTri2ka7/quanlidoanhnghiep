import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" để file index.html sau khi build có thể load asset bằng đường dẫn
// tương đối, cần thiết khi Electron load file qua giao thức file://
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    global: "window",
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
