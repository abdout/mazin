import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  resolve: {
    alias: {
      // Prisma's generated client picks its Node build under Vite, which compiles the
      // query-compiler WASM from base64 at runtime — workerd forbids that. The edge
      // build imports the .wasm as a module instead.
      "@prisma/client": fileURLToPath(
        new URL("./node_modules/.prisma/client/edge.js", import.meta.url)
      ),
    },
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
