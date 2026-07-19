import { defineConfig } from "vitest/config";

// Unit tests live in tests/. The e2e/ folder is Playwright-only — keep vitest
// from picking up the Playwright specs.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
