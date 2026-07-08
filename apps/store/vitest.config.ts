import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // mongodb-memory-server descarga el binario de mongod en el primer run
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
