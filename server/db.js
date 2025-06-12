import { Database } from "bun:sqlite";

export const db = new Database("mydb.sqlite", { create: true, strict: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");