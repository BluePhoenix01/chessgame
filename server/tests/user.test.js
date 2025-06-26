// Set secrets for Bun test environment
Bun.env.ACCESS_TOKEN_SECRET = "test-access-secret";
Bun.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

import { describe, beforeAll, afterAll, test, expect } from "bun:test";
import app from "../src/index.js";

let server;
let baseUrl;

beforeAll(() => {
  server = Bun.serve({ fetch: app.fetch, port: 3001 });
  baseUrl = `http://${server?.hostname || "localhost"}:${server.port}`;
});
afterAll(async () => {
  await server.stop(true);
});

describe("users", () => {
  test("Get user info with valid token", async () => {
    const unique = Math.random().toString(36).slice(2);
    const username = `test_${unique}`;
    const email = `test_${unique}@localhost`;
    const password = "password";
    // Signup
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password, email }),
    });
    expect(signupRes.status).toBe(200);
    const { accessToken } = await signupRes.json();
    // Get user info
    const userRes = await fetch(`${baseUrl}/api/user`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    expect(userRes.status).toBe(200);
    const userData = await userRes.json();
    expect(userData).toHaveProperty("user");
    expect(userData.user).toHaveProperty("username", username);
  });
});

describe("user games", () => {
  test("Get user games with valid token (empty list)", async () => {
    const unique = Math.random().toString(36).slice(2);
    const username = `test_${unique}`;
    const email = `test_${unique}@localhost`;
    const password = "password";
    // Signup
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password, email }),
    });
    expect(signupRes.status).toBe(200);
    const { accessToken } = await signupRes.json();
    // Get user games
    const gamesRes = await fetch(`${baseUrl}/api/user/games`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    expect(gamesRes.status).toBe(200);
    const gamesData = await gamesRes.json();
    expect(gamesData).toHaveProperty("games");
    expect(Array.isArray(gamesData.games)).toBe(true);
  });
});
