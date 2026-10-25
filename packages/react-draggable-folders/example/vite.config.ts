import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { packageSize } from "./package-size"

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss(), packageSize()],
  server: { port: 5176, strictPort: true },
})
