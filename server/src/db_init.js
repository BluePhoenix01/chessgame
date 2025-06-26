import { Database } from "bun:sqlite";

import path from "node:path";

const baseDir = import.meta.dir;
const dbFile = path.resolve(baseDir, "../mydb.sqlite");

export function createDatabase(name) {
  const db = new Database(name, { create: true, strict: true });

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    white_player_id INTEGER NOT NULL,
    black_player_id INTEGER NOT NULL,
    result TEXT CHECK(result IN ('1-0', '0-1', '1/2-1/2')) NOT NULL,
    moves TEXT NOT NULL, -- PGN format or move list
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (white_player_id) REFERENCES users(id),
    FOREIGN KEY (black_player_id) REFERENCES users(id)
    );`);
}

createDatabase(dbFile);
