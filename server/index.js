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

    "/createroom": (_req) => {
      const roomId = crypto.randomUUID();
      return new Response(JSON.stringify({ roomId }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
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
    const roomId = new URL(req.url).searchParams.get("roomId");
    if (server.upgrade(req, { data: roomId })) {
      return new Response("Upgraded to Websocket", { status: 101 });
    }
    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      // const id = crypto.randomUUID();
      const id = ws.data;
      if (!rooms.get(id)) {
        rooms.set(id, { clients: new Set(), game: new Chess() });
      }

      if (rooms.get(id).clients.size === 0) {
        ws.side = Math.random() < 0.5 ? "w" : "b";
      }
      else if (rooms.get(id).clients.size === 1) {
        ws.side = rooms.get(id).clients.values().next().value.side === "w" ? "b" : "w";
      }
      else {
        ws.side = "spectator"
      }
      rooms.get(id).clients.add(ws);
      ws.send(JSON.stringify({side: ws.side}));
    },
    message(ws, message) {
      const room = rooms.get(ws.data);

      if (room.game.turn() !== ws.side) {
        return ;
      }
      const move = JSON.parse(message);
      const result = room.game.move(move);
      if (result) {
        for (const client of room.clients) {
          client.send(JSON.stringify({ result, fen: room.game.fen() }));
        }
      }
    },
    close(ws, code, message) {
      const room = rooms.get(ws.data);
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        rooms.delete(ws.data);
      }
    },
  },
});
