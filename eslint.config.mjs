import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Layering: browser code (components, shared lib, content) must never import server-only modules.
  {
    files: ["src/components/**", "src/lib/**", "src/content/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/server/*", "**/server/*"], message: "Server-only code: call it through an API route instead." }] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/mobile-build/dist/**",
  ]),
]);

export default eslintConfig;
