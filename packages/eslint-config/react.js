import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import { defineConfig } from "eslint/config"
import base from "./base.js"

/**
 * Lint config for React + Vite browser apps. Extends the shared base with
 * the React Hooks rules, react-refresh's Vite preset, and browser globals.
 */
export default defineConfig([
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
