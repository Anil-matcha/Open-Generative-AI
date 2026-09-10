import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      "packages/Vibe-Workflow/**",
      "packages/Open-Poe-AI/**",
      "packages/Open-AI-Design-Agent/**",
      "packages/studio/dist/**",
      "dist/**",
      "release/**",
      "build/**",
    ],
  },
];

export default eslintConfig;
