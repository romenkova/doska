import base from "@doska/configs/prettier"

/**
 * @type {import("prettier").Config}
 */
export default {
  ...base,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "src/index.css",
  tailwindFunctions: ["cn", "cva"],
}
