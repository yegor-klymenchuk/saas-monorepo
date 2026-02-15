import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      ...dotenv.config({ path: ".env.test" }).parsed,
    },
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "src/test/", "**/*.test.ts", "**/*.spec.ts", "drizzle/"],
    },
  },
});
