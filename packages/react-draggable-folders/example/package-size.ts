import { gzipSync } from "node:zlib"
import { build, type Plugin } from "vite"
import pkg from "../package.json" with { type: "json" }

// Peers are what the app already ships; direct deps count toward the size.
const peers = Object.keys(pkg.peerDependencies)

export function packageSize(): Plugin {
  return {
    name: "package-size",
    async config() {
      const kb = await gzippedKb()
      return { define: { __PACKAGE_KB__: JSON.stringify(kb.toFixed(0)) } }
    },
  }
}

async function gzippedKb() {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    root: import.meta.dirname,
    define: { "process.env.NODE_ENV": '"production"' },
    build: {
      write: false,
      minify: true,
      lib: { entry: "../src/index.ts", formats: ["es"], fileName: "index" },
      rolldownOptions: {
        external: (id) =>
          peers.some((name) => id === name || id.startsWith(`${name}/`)),
      },
    },
  })
  const outputs = Array.isArray(result) ? result : [result]
  let bytes = 0
  for (const output of outputs) {
    if (!("output" in output)) continue
    for (const chunk of output.output) {
      if (chunk.type === "chunk") bytes += gzipSync(chunk.code).length
    }
  }
  return bytes / 1000
}
