import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Forces zustand through Vite's transform pipeline instead of Node's
    // native module resolution, so @preact/preset-vite's react ->
    // preact/compat alias applies to zustand's react-hook binding too.
    server: { deps: { inline: ["zustand"] } },
  },
});
