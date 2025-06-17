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
      try {
        const data = jwt.verify(token, Bun.env.ACCESS_TOKEN_SECRET);
        const games = db
        .query(`SELECT * FROM games WHERE white_player_id = ?1 OR black_player_id = ?1;`)
        .all(data.userId);
        return new Response(JSON.stringify({ games }), {
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