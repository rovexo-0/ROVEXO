import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "ROVEXO/.next/**",
    "ROVEXO/**",
    "archive/**",
    "out/**",
    "build/**",
    "test-results/**",
    "playwright-report/**",
    "_wip/**",
    "next-env.d.ts",
  ]),
  // Messages module is frozen — allow known intentional resume-checkout effect.
  {
    files: ["features/messages/components/ChatPage.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
