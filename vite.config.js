import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "server" } }),
  ],
  environments: {
    server: {
      build: {
        outDir: "dist/server",
        rollupOptions: {
          output: { entryFileNames: "index.js" },
        },
      },
    },
    client: {
      build: { outDir: "dist/client" },
    },
  },
});
