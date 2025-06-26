import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { logger } from "hono/logger";
import { Chess } from "chess.js";
import crypto from "bun:crypto";
import { trimTrailingSlash } from "hono/trailing-slash";

const app = new Hono();
const { upgradeWebSocket, websocket } = createBunWebSocket();
const rooms = new Map();

app.use(logger());

app.use(
  "/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    credentials: true,
    maxAge: 600,
  })
);
app.use(trimTrailingSlash());

app.route("/auth", authRoutes);
app.route("/api/user", userRoutes);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/createroom", async (c) => {
  const roomId = crypto.randomUUID();
  return c.json({ roomId }, 200);
});

app.get(
  "/room",
  upgradeWebSocket((c) => {
    let side;
    let token;
    const roomId = c.req.query("roomId");
    if (!roomId) {
      throw new Error("Missing roomId");
    }
    return {
      onOpen(event, ws) {
        if (!rooms.has(roomId)) {
          rooms.set(roomId, {
            clients: new Set(),
            game: new Chess(),
            whitePlayer: null,
            blackPlayer: null,
          });
        }

        const room = rooms.get(roomId);
        side =
          room.clients.size === 0
            ? Math.random() < 0.5
              ? "w"
              : "b"
            : room.clients.values().next().value.side === "w"
            ? "b"
            : "w";
        room.clients.add(ws);
        ws.send(
          JSON.stringify({ type: "join", side: side, fen: room.game.fen() })
        );
      },
      onMessage(event, ws) {
        const room = rooms.get(roomId);
        const msg = JSON.parse(event.data);

        if (msg.type === "auth") {
          token = msg.token;
          try {
            const authData = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
            if (!room.whitePlayer && side === "w") {
              room.whitePlayer = authData.username;
              room.game.setHeader("White", authData.username);
            } else if (!room.blackPlayer && side === "b") {
              room.blackPlayer = authData.username;
              room.game.setHeader("Black", authData.username);
            }
          } catch {}
          room.clients.forEach((client) =>
            client.send(
              JSON.stringify({
                type: "players",
                whitePlayer: room.whitePlayer,
                blackPlayer: room.blackPlayer,
              })
            )
          );
          return;
        }

        let authData;
        try {
          authData = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
        } catch {
          return;
        }

        if (msg.type === "move") {
          if (room.game.turn() !== side) return;
          const result = room.game.move(msg.move) || null;
          if (room.game.isGameOver()) {
            let gameResult = "*";
            if (room.game.isCheckmate())
              gameResult = room.game.turn() === "w" ? "0-1" : "1-0";
            else if (
              room.game.isStalemate() ||
              room.game.isThreefoldRepetition() ||
              room.game.insufficientMaterial() ||
              room.game.isDraw()
            )
              gameResult = "1/2-1/2";
            const users = {};
            room.clients.forEach((client) => {
              if (client.side !== "spectator") {
                const d = jwt.verify(client.token, Bun.env.ACCESS_TOKEN_SECRET);
                users[client.side] = d.userId;
              }
            });
            room.game.setHeader("Result", gameResult);
            db.query(
              "INSERT INTO games (white_player_id, black_player_id, result, moves) VALUES (?1,?2,?3,?4);"
            ).run(users.w, users.b, gameResult, room.game.pgn());
          }
          if (result) {
            room.clients.forEach((client) =>
              client.send(
                JSON.stringify({
                  type: "position",
                  result,
                  fen: room.game.fen(),
                })
              )
            );
          }
        }

        if (msg.type === "resign") {
          const gameResult = room.game.turn() === "w" ? "0-1" : "1-0";
          const users = {};
          room.clients.forEach((client) => {
            if (client.side !== "spectator") {
              const d = jwt.verify(client.token, Bun.env.ACCESS_TOKEN_SECRET);
              users[client.side] = d.userId;
            }
          });
          room.game.setHeader("Result", gameResult);
          db.query(
            "INSERT INTO games (white_player_id, black_player_id, result, moves) VALUES (?1,?2,?3,?4);"
          ).run(users.w, users.b, gameResult, room.game.pgn());
        }

        if (msg.type === "chat") {
          let username = "Anonymous";
          try {
            const d = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
            username = d.username;
          } catch {}
          room.clients.forEach((client) => {
            if (client.side !== "spectator") {
              client.send(JSON.stringify({ ...msg, username }));
            }
          });
        }
      },
      onClose(ws) {
        const room = rooms.get(roomId);
        room.clients.delete(ws);
        if (room.clients.size === 0) rooms.delete(roomId);
      },
    };
  })
);

export default {
  port: 3001,
  fetch: app.fetch,
  websocket,
};
