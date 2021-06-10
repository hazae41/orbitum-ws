import { serve, ServerRequest } from "https://deno.land/std@0.98.0/http/server.ts";
import { acceptWebSocket } from "https://deno.land/std@0.98.0/ws/mod.ts";
import { prices } from "./watcher.ts"

const server = serve({ port: 1993 });
const memory = { total: 0, prices }

const headers = new Headers({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET"
})

export class Handler {
  static async connect(request: ServerRequest) {
    const socket = await acceptWebSocket({
      conn: request.conn,
      bufReader: request.r,
      bufWriter: request.w,
      headers: request.headers,
    })

    try {
      memory.total++
      for await (const _ of socket);
    } catch (e: unknown) {
      if (socket.isClosed) return
      await socket.close(1000)
    } finally {
      memory.total--
    }
  }

  static async total(request: ServerRequest) {
    const body = JSON.stringify(memory.total)
    await request.respond({ status: 200, body, headers })
  }

  static async prices(request: ServerRequest) {
    const body = JSON.stringify(memory.prices)
    await request.respond({ status: 200, body, headers })
  }
}

async function route(request: ServerRequest) {
  try {
    if (request.url === "/connect")
      return await Handler.connect(request)

    if (request.url === "/total")
      return await Handler.total(request)

    if (request.url === "/prices")
      return await Handler.prices(request)

    throw new Error()
  } catch (e: unknown) {
    await request.respond({ status: 400 });
  }
}

for await (const request of server)
  route(request).catch(console.error)