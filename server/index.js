import { Chess } from "chess.js";

const rooms = new Map();

Bun.serve({
  port: 3001,
  // `routes` requires Bun v1.2.3+
  routes: {
    // Static routes
    "/api/status": new Response("OK"),

    "/user": {
      POST: async (req) => {
        const userdata = await req.json();
        return new Response(`Creating user: ${JSON.stringify(userdata)}`);
      },
    },

    // Dynamic routes
    "/user/:id": {
      GET: (req) => {
        return new Response(`Hello User ${req.params.id}!`);
      },
      PUT: async (req) => {
        const id = req.params.id;
        const userdata = await req.json();
        return new Response(`Updating user ${id}: ${JSON.stringify(userdata)}`);
      },
    },

    "/": (req) => {
      return new Response("Hello! World");
    },

    // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
    "/api/*": Response.json({ message: "Not found" }, { status: 404 }),
  },

  // (optional) fallback for unmatched routes:
  // Required if Bun's version < 1.2.3
  fetch(req, server) {
    if (server.upgrade(req)) {
      return new Response("Upgraded to Websocket", { status: 101 });
    }
    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      // const id = crypto.randomUUID();
      const id = 1;
      ws.id = id;
      if (!rooms.get(id)){
        rooms.set(id, { clients: new Set(), game: new Chess() });
      }
      rooms.get(id).clients.add(ws);
    },
    message(ws, message) {
      const room = rooms.get(ws.id);
      const move = JSON.parse(message);
      const result = room.game.move(move);
      if (result) {
        for (const client of room.clients) {
          client.send(JSON.stringify({ result, fen: room.game.fen() }));
        }
      }
    },
    close(ws, code, message) {
      const room = rooms.get(ws.id);
      room.clients.delete(ws);
    },
  },
});
