import type { ServerWebSocket } from "bun";

const clients = new Map<string, ServerWebSocket>() 

Bun.serve({
  port: 3000,
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
    open(ws: any) {
      const id = crypto.randomUUID();
      ws.id = id;
      clients.set(id, ws);
      ws.send("Welcome");
    },
    message(ws: any, message) {
      for (const [id, socket] of clients) {
        ws.send(message);
      }
    },
    close(ws: any, code, message) {
      clients.delete(ws.id);
    },
  },
});
