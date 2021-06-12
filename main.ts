import { serve, ServerRequest } from "https://deno.land/std@0.98.0/http/server.ts";
import { acceptWebSocket } from "https://deno.land/std@0.98.0/ws/mod.ts";
import { prices } from "./uniswap.ts"

const server = serve({ port: 1993 });

const counts: Record<string, number> = {}

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

    let current: string | undefined;

    try {
      counts["total"] ??= 0
      counts["total"]++

      for await (const msg of socket) {
        if (typeof msg !== "string")
          continue
        if (current)
          counts[current]--

        current = msg
        counts[current] ??= 0
        counts[current]++
      }
    } catch (e: unknown) {
      if (socket.isClosed) return
      await socket.close(1000)
    } finally {
      if (current)
        counts[current]--

      counts["total"]--
    }
  }

  static async total(request: ServerRequest) {
    const body = JSON.stringify(counts["total"] ?? 0)
    await request.respond({ status: 200, body, headers })
  }

  static async count(request: ServerRequest, url: URL) {
    const path = url.searchParams.get("path")
    if (!path) throw new Error("No path provided")
    const body = JSON.stringify(counts[path] ?? 0)
    await request.respond({ status: 200, body, headers })
  }

  static async prices(request: ServerRequest) {
    const body = JSON.stringify(prices)
    await request.respond({ status: 200, body, headers })
  }
}

async function route(request: ServerRequest) {
  try {
    const url = new URL(request.url, "https://orbitum.space")

    if (url.pathname === "/connect")
      return await Handler.connect(request)

    if (url.pathname === "/total")
      return await Handler.total(request)

    if (url.pathname === "/count")
      return await Handler.count(request, url)

    if (url.pathname === "/prices")
      return await Handler.prices(request)

    throw new Error()
  } catch (e: unknown) {
    if (!(e instanceof Error)) return
    await request.respond({
      status: 400,
      body: e.message,
      headers: headers
    });
  }
}

for await (const request of server)
  route(request).catch(console.error)