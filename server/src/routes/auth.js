import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import jwt from "jsonwebtoken";
import { db } from "../db";

const app = new Hono();

app.post("/signup", async (c) => {
  const { username, email, password } = await c.req.json();
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

    setCookie(c, "refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 604800,
      path: "/",
    });

    return c.json({ accessToken, username: user.username });
  } catch (err) {
    return c.json({ error: "User already exists" }, 409);
  }
});

app.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  const user = db
    .query(`SELECT * FROM users WHERE username = ?1`)
    .get(username);

  if (!user) return c.json({ error: "Invalid Credentials" }, 401);

  const isValid = await Bun.password.verify(password, user.password_hash);
  if (!isValid) return c.json({ error: "Invalid Credentials" }, 401);

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

  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 604800,
    path: "/",
  });

  return c.json({ accessToken, username: user.username });
});

app.get("/verify", async (c) => {
  const refreshToken = getCookie(c, "refreshToken");
  const authHeader = c.req.header("Authorization");
  const accessToken = authHeader?.split(" ")[1];

  if (accessToken) {
    try {
      jwt.verify(accessToken, Bun.env.ACCESS_TOKEN_SECRET);
      return c.json({ accessToken });
    } catch {}
  }

  if (!refreshToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const data = jwt.verify(refreshToken, Bun.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(
      { userId: data.userId, username: data.username },
      Bun.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    return c.json({ accessToken: newAccessToken });
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

app.post("/logout", (c) => {
  deleteCookie(c, "refreshToken", { path: "/" });
  return c.text("Logged out");
});

export default app;
