import jwt from "jsonwebtoken";
import { db } from "../db";
import { corsHeaders } from "../config";


export const authRoutes = {
  "/auth/signup": {
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
            Bun.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
          );
          const refreshToken = jwt.sign(
            { userId: user.id, username: user.username },
            Bun.env.REFRESH_TOKEN_SECRET,
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
    "/auth/login": {
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
          Bun.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
          { userId: user.id, username: user.username },
          Bun.env.REFRESH_TOKEN_SECRET,
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
    "/auth/verify": {
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
          jwt.verify(accessToken, Bun.env.ACCESS_TOKEN_SECRET);
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
          const data = jwt.verify(refreshToken, Bun.env.REFRESH_TOKEN_SECRET);
          const newAccessToken = jwt.sign(
            { userId: data.userId, username: data.username },
            Bun.env.ACCESS_TOKEN_SECRET,
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
    "/auth/logout": {
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
}