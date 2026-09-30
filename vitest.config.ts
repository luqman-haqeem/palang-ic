import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Pins the timezone so the local-vs-UTC date tests are deterministic.
    env: { TZ: "Asia/Kuala_Lumpur" },
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});
