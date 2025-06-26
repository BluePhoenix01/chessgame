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

describe("signup", () => {
  test("Signup Successful", async () => {
    const unique = Math.random().toString(36).slice(2);
    const res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: `test_${unique}`, password: "password", email: `test_${unique}@localhost` }),
    });
    expect(res.status).toBe(200);
  });
});

describe("login", () => {
  test("Login Successful", async () => {
    const unique = Math.random().toString(36).slice(2);
    const username = `test_${unique}`;
    const email = `test_${unique}@localhost`;
    const password = "password";
    // First, signup
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password, email }),
    });
    expect(signupRes.status).toBe(200);
    // Then, login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData).toHaveProperty("accessToken");
    expect(loginData).toHaveProperty("username", username);
  });
});


