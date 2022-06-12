import { eqic } from "./libs/string.ts";

const headers = new Headers({
  "Access-Control-Allow-Origin": "*"
})

const sockets = new Map<WebSocket, string | undefined>()
const paths: Record<string, number> = {}

async function onconn(conn: Deno.Conn) {
  const http = Deno.serveHttp(conn)

  for await (const e of http)
    onreq(e.request)
      .then(e.respondWith)
      .catch(console.error)
}

async function onreq(req: Request) {
  const url = new URL(req.url)

  if (url.pathname == "/paths")
    return new Response(JSON.stringify({ total: sockets.size, paths }), { headers })

  const upgrade = req.headers.get("upgrade")

  if (!eqic(upgrade, "websocket"))
    return new Response(null, { status: 400 })

  const upgraded = Deno.upgradeWebSocket(req)
  onsocket(upgraded.socket).catch(console.error)
  return upgraded.response
}

function increment(path?: string) {
  if (!path) return
  const value = paths[path]
  if (!value) paths[path] = 1
  else paths[path] = value + 1
}

function decrement(path?: string) {
  if (!path) return
  const value = paths[path]
  if (value == undefined) return
  if (value <= 1) delete paths[path]
  else paths[path] = value - 1
}

async function onsocket(socket: WebSocket) {
  await new Promise<void>((ok, err) => {
    socket.onopen = _ => ok()
    socket.onerror = e => err(e)
  })

  sockets.set(socket, undefined)

  function onmessage(path: any) {
    try {
      if (typeof path !== "string")
        return

      decrement(sockets.get(socket))
      sockets.set(socket, path)
      increment(path)
    } catch (e: unknown) { }
  }

  socket.onmessage = e => onmessage(e.data)
  await new Promise(ok => socket.onclose = ok)

  decrement(sockets.get(socket))
  sockets.delete(socket)
}

while(true) {
	try {
		const server = Deno.listen({ port: 1993 })

		for await (const conn of server)
			onconn(conn).catch(console.error)
	} catch (e:unknown) {
		console.error(e)
	}
}
