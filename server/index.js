import { Chess } from "chess.js";
import { Database } from "bun:sqlite";
import jwt from "jsonwebtoken";
import { authRoutes } from "./routes/auth";

const rooms = new Map();
const db = new Database("mydb.sqlite", { create: true, strict: true });

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

Bun.serve({
  port: 3001,
  hostname: "localhost",
  // `routes` requires Bun v1.2.3+
  routes: {
    // Static routes
    "/api/status": new Response("OK"),

    ...authRoutes,

    "/createroom": (_req) => {
      const roomId = crypto.randomUUID();
      return new Response(JSON.stringify({ roomId }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    },
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
      } else if (rooms.get(id).clients.size === 1) {
        ws.side =
          rooms.get(id).clients.values().next().value.side === "w" ? "b" : "w";
      } else {
        ws.side = "spectator";
      }

      rooms.get(id).clients.add(ws);
      ws.send(JSON.stringify({ side: ws.side }));
    },
    message(ws, message) {
      const room = rooms.get(ws.data);
      const messageObj = JSON.parse(message);
      if (messageObj.type === "auth" && messageObj.token !== "") {
        ws.token = messageObj.token;
        return;
      }

      const authData = jwt.verify(ws.token, ACCESS_TOKEN_SECRET);
      if (!authData) {
        return;
      }
      if (room.game.turn() !== ws.side) {
        return;
      }
      const move = messageObj;
      let result;
      try {
        result = room.game.move(move);
      } catch {
        result = null;
      }

      if (room.game.isGameOver()) {
        let gameResult = "*";

        if (room.game.isCheckmate()) {
          gameResult = room.game.turn() === "w" ? "0-1" : "1-0";
        } else if (room.game.isStalemate()) {
          gameResult = "1/2-1/2";
        } else if (room.game.isThreefoldRepetition()) {
          gameResult = "1/2-1/2";
        } else if (room.game.inSufficientMaterial()) {
          gameResult = "1/2-1/2";
        } else if (room.game.isDraw()) {
          gameResult = "1/2-1/2";
        }
        const users = {};
        for (const client of room.clients) {
          if (client.side === "spectator") {
            continue;
          }
          const data = jwt.verify(client.token, ACCESS_TOKEN_SECRET);
          users[client.side] = data.userId;
        }
        room.game.setHeader("Result", gameResult);
        const query = db
          .query(
            "INSERT INTO games (white_player_id, black_player_id, result, moves) VALUES (?1, ?2, ?3, ?4);"
          )
          .run(users.w, users.b, gameResult, room.game.pgn());
      }
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
