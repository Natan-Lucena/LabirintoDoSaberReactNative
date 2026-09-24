import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";
import { reactNative } from "vitest-native";

export default defineConfig({
  plugins: [
    reactNative({
      engine: "native",
      platform: "android",
      transform: [
        "react-native-calendars",
        "recyclerlistview",
        "react-native-swipe-gestures",
      ],
    }),
  ],
  resolve: {
    mainFields: ["main", "module"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
  },
});
