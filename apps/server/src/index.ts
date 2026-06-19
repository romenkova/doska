import { RPCHandler } from "@orpc/server/node"
import Fastify from "fastify"
import { router } from "./router"

const handler = new RPCHandler(router)
const app = Fastify({ logger: true })

// Don't let Fastify consume the request body, oRPC reads the raw stream.
app.addContentTypeParser("application/json", (_req, _payload, done) => {
  done(null, undefined)
})

app.all("/rpc/*", async (req, reply) => {
  const { matched } = await handler.handle(req.raw, reply.raw, {
    prefix: "/rpc",
    context: {},
  })
  if (matched) return reply.hijack()
  reply.code(404).send("Not Found")
})

const port = Number(process.env.PORT ?? 3000)
app.listen({ port }).catch((err) => {
  app.log.error(err)
  process.exit(1)
})
