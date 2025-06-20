import jwt from "jsonwebtoken";
import { db } from "../db";
import { corsHeaders } from "../config";

export const userRoutes = {
  "/user": {
    GET: (req) => {
      const token = req.headers.get("Authorization").split(" ")[1];
      try {
        const data = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
        const user = db
        .query(`SELECT username, created_at FROM users WHERE id = ?1;`)
        .get(data.userId);
        return new Response(JSON.stringify({ user }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    },
    OPTIONS: () => {
        return new Response(null, { status: 204, headers: corsHeaders });
      },  
  },
  "/user/games": {
    GET: (req) => {
      const token = req.headers.get("Authorization").split(" ")[1];
      const page = new URL(req.url).searchParams.get("page") || 1;
      const limit = 10;
      try {
        const data = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
        const games = db
        .query("SELECT wu.username white_username, bu.username black_username, g.result, g.moves, g.created_at, g.id FROM games g JOIN users wu on g.white_player_id = wu.id JOIN users bu on g.black_player_id = bu.id WHERE white_player_id = ?1 OR black_player_id = ?1 LIMIT ?2 OFFSET ?2 * (?3 - 1);")
        .all(data.userId, limit, page);
        const lastGame = db
        .query("SELECT id FROM games WHERE white_player_id = ?1 OR black_player_id = ?1  ORDER BY created_at DESC LIMIT 1;").get(data.userId);
        
        const lastPage = games ? games.at(-1).id === lastGame.id : true;
        
        return new Response(JSON.stringify({ games, lastPage }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    },
  }
}