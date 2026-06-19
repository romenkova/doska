import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

const sqlite = new Database(process.env.DB_FILE ?? "data.db")
sqlite.pragma("journal_mode = WAL")

// Create the schema on first run
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    seq_counter INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    position TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    seq INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    title TEXT NOT NULL,
    position TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    seq INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS columns_board_seq ON columns (board_id, seq);
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    column_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    position TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    seq INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS cards_board_seq ON cards (board_id, seq);
`)

export const db = drizzle(sqlite, { schema })
