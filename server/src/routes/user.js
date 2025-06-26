import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { db } from "../db";

const app = new Hono();

app.get("/", async (c) => {
  const auth = c.req.header("Authorization") || "";
  const token = auth.split(" ")[1];
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const data = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
    const user = db
      .query("SELECT username, created_at FROM users WHERE id = ?1;")
      .get(data.userId);
    return c.json({ user }, 200);
  } catch (err) {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

app.get("/games", async (c) => {
  const auth = c.req.header("Authorization") || "";
  const token = auth.split(" ")[1];
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const data = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
    const userId = data.userId;
    const page = Number(c.req.query("page") || "1");
    const limit = 10;

    const games = db
      .query(
        `
        SELECT wu.username AS white_username,
               bu.username AS black_username,
               g.result, g.moves, g.created_at, g.id
        FROM games g
        JOIN users wu ON g.white_player_id = wu.id
        JOIN users bu ON g.black_player_id = bu.id
        WHERE white_player_id = ?1 OR black_player_id = ?1
        LIMIT ?2 OFFSET ?2 * (?3 - 1);
      `
      )
      .all(userId, limit, page);

    const lastGame = db
      .query(
        `
        SELECT id FROM games
        WHERE white_player_id = ?1 OR black_player_id = ?1
        ORDER BY created_at DESC
        LIMIT 1;
      `
      )
      .get(userId);

    const lastPage = games.length > 0 && games.at(-1).id === lastGame.id;

    return c.json({ games, lastPage }, 200);
  } catch (err) {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

export default app;
