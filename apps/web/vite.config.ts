import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@przedszkole/shared": resolve(
        __dirname,
        "../../packages/shared/src/index.ts",
      ),
      "../../packages/shared/src/i18n/pl/translation.json": resolve(
        __dirname,
        "../../packages/shared/src/i18n/pl/translation.json",
      ),
      "../../packages/shared/src/i18n/en/translation.json": resolve(
        __dirname,
        "../../packages/shared/src/i18n/en/translation.json",
      ),
    },
  },
  server: {
    port: 5173,
  },
});
