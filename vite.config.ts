import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/vtc-objectif-4000/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
