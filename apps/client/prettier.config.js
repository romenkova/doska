import base from "@doska/configs/prettier"

/**
 * Client formatting = shared base + Tailwind class sorting. The Tailwind plugin
 * and its stylesheet path are client-specific, so they live here rather than in
 * the shared config.
 *
 * @type {import("prettier").Config}
 */
export default {
  ...base,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "src/index.css",
  tailwindFunctions: ["cn", "cva"],
}
