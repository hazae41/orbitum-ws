import { prices } from "./prices.ts";

const server = Deno.listen({ port: 1993 })

const sockets = new Map<WebSocket, string>()
const paths: Record<string, number> = {}

setInterval(() => {
  broadcast().catch(console.error)
}, 1000)

setInterval(() => {
  broadcast2().catch(console.error)
}, 60000)

for await (const conn of server)
  onconn(conn).catch(console.error)

async function onconn(conn: Deno.Conn) {
  const http = Deno.serveHttp(conn)

  for await (const e of http)
    onreq(e.request)
      .then(e.respondWith)
      .catch(console.error)
}

function eqic(a?: string | null, b?: string | null) {
  return a?.toLowerCase() === b?.toLowerCase()
}

async function onreq(req: Request) {
  const upgrade = req.headers.get("upgrade")

  if (!eqic(upgrade, "websocket"))
    return new Response(null, { status: 400 })

  const upgraded = Deno.upgradeWebSocket(req)
  onsocket(upgraded.socket).catch(console.error)
  return upgraded.response
}

async function onsocket(socket: WebSocket) {
  await new Promise<void>((ok, err) => {
    socket.onopen = _ => ok()
    socket.onerror = e => err(e)
  })

  sockets.set(socket, "")

  const total = sockets.size
  const data: any = { total, prices }
  socket.send(JSON.stringify(data))

  function onmessage(msg: any) {
    if (typeof msg !== "string")
      return

    const old = sockets.get(socket)
    if (old) paths[old]--

    sockets.set(socket, msg)

    if (msg) {
      paths[msg] ??= 0
      paths[msg]++
    }

    const total = sockets.size
    const data: any = { total }
    if (msg) data[msg] = paths[msg]

    try {
      socket.send(JSON.stringify(data))
    } catch (e: unknown) {
      console.error(e)
    }
  }

  socket.onmessage = e => onmessage(e.data)
  await new Promise(ok => socket.onclose = ok)

  const path = sockets.get(socket)
  if (path) paths[path]--
  sockets.delete(socket)
}

async function broadcast() {
  const total = sockets.size

  for (const [socket, path] of sockets) {
    const data: any = { total }
    if (path) data[path] = paths[path]
    socket.send(JSON.stringify(data))
  }
}

async function broadcast2() {
  for (const [socket, path] of sockets) {
    const data: any = { prices }
    if (path) data[path] = paths[path]
    socket.send(JSON.stringify(data))
  }
}