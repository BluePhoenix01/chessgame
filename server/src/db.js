import { Database } from "bun:sqlite";
import path from "node:path";

const baseDir = import.meta.dir;
const dbFile = path.resolve(baseDir, "../mydb.sqlite");

export function createDb() {
  let db;
  if (Bun.env.NODE_ENV === "test") {
    db = new Database(":memory:", { create: true, strict: true });
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  db.exec(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    white_player_id INTEGER NOT NULL,
    black_player_id INTEGER NOT NULL,
    result TEXT CHECK(result IN ('1-0', '0-1', '1/2-1/2')) NOT NULL,
    moves TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (white_player_id) REFERENCES users(id),
    FOREIGN KEY (black_player_id) REFERENCES users(id)
    );`);
  } else {
    db = new Database(dbFile, { create: true, strict: true });
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}

export const db = createDb();
