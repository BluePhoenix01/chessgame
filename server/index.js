import { Chess } from "chess.js";
import { Database } from "bun:sqlite";
import jwt from "jsonwebtoken";

const rooms = new Map();
const db = new Database("mydb.sqlite", { create: true, strict: true });

const ACCESS_TOKEN_SECRET = "ajyvshckano918uisq";
const REFRESH_TOKEN_SECRET = "iusbac8hgg19qbc";

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
          ...corsHeaders,
        },
      });
    },

    "/api/signup": {
      POST: async (req) => {
        const { username, email, password } = await req.json();
        const hashedPassword = await Bun.password.hash(password, {
          algorithm: "bcrypt",
          cost: 9,
        });
        try {
          db.query(
            `INSERT INTO users (username, email, password_hash) VALUES (?1, ?2, ?3);`
          ).run(username, email, hashedPassword);
          const user = db
            .query(`SELECT * FROM users WHERE username = ?1;`)
            .get(username);
          const accessToken = jwt.sign(
            { userId: user.id, username: user.username },
            ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
          );
          const refreshToken = jwt.sign(
            { userId: user.id, username: user.username },
            REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
          );
          return Response.json(
            { message: "User registered successfully" },
            { accessToken },
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Set-Cookie": Bun.Cookie.from("refreshToken", refreshToken, {
                  httpOnly: true,
                  sameSite: "strict",
                  maxAge: 604800,
                  path: "/",
                }),
                ...corsHeaders,
              },
            }
          );
        } catch (err) {
          return Response.json(
            { error: "User already exists" },
            {
              status: 409,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      },
      OPTIONS: () => {
        return new Response(null, { status: 204, headers: corsHeaders });
      },
    },
    "/api/login": {
      POST: async (req) => {
        const { username, password } = await req.json();
        const user = db
          .query(`SELECT * FROM users WHERE username = ?1`)
          .get(username);
        if (!user) {
          return Response.json(
            { error: "Invalid Credentials" },
            {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        const isPasswordValid = await Bun.password.verify(
          password,
          user.password_hash
        );
        if (!isPasswordValid) {
          return Response.json(
            { error: "Invalid Credentials" },
            {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        const accessToken = jwt.sign(
          { userId: user.id, username: user.username },
          ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
          { userId: user.id, username: user.username },
          REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }
        );
        return Response.json(
          { accessToken },
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": Bun.Cookie.from("refreshToken", refreshToken, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 604800,
                path: "/",
              }),
              ...corsHeaders,
            },
          }
        );
      },
      OPTIONS: () => {
        return new Response(null, { status: 204, headers: corsHeaders });
      },
    },
    "/verify": {
      GET: (req) => {
        const cookies = req.cookies;
        if (!cookies.has("refreshToken")) {
          return Response.json(
            { error: "Unauthorized" },
            {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        try {
          const accessToken = req.headers.get("Authorization").split(" ")[1];
          jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
          return Response.json(
            { accessToken },
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        } catch (err) {}
        const refreshToken = cookies.get("refreshToken");
        try {
          const data = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
          const newAccessToken = jwt.sign(
            { userId: data.userId, username: data.username },
            ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
          );
          return Response.json(
            { accessToken: newAccessToken },
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        } catch (err) {
          return Response.json(
            { error: "Unauthorized" },
            {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      },
      OPTIONS: () => {
        return new Response(null, { status: 204, headers: corsHeaders });
      },
    },
    "/api/logout": {
      POST: (req) => {
        return new Response("Logged out", {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "Set-Cookie": Bun.Cookie.from("refreshToken", "", {
              httpOnly: true,
              sameSite: "strict",
              maxAge: 0,
              path: "/",
            }),
            ...corsHeaders,
          },
        });
      },
      OPTIONS: () => {
        return new Response(null, { status: 204, headers: corsHeaders });
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
        room.game.setHeader("Result", gameResult); // doesnt work
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
