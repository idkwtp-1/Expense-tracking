import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  plugins: [
    tanstackStart({
      server: { entry: "src/server.ts" },
      nitro: { preset: "vercel" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
