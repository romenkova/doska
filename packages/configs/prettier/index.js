/**
 * Shared Prettier config for the monorepo. Framework-agnostic formatting
 * rules only. Packages that need extra plugins (e.g. Tailwind) import this
 * and spread their additions on top in a local prettier.config.js.
 *
 * @type {import("prettier").Config}
 */
export default {
  endOfLine: "lf",
  semi: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 80,
}
