import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // React 19 compiler hints — useful signal but too noisy for async-polling
      // patterns we intentionally use (verification form, notification bell).
      // Revisit after the React Compiler is enabled.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artefacts — linting these wastes CI time and produces noise.
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "prisma/migrations/**",
  ]),
]);

export default eslintConfig;
