import { getDB } from "./get-db"

/**
 * Prod points `DATABASE_URL` at a real server;
 * local dev and e2e fall back to PGlite
 *
 * PGlite persists to `DB_FILE` (a directory) when set, or runs in-memory when
 * not, which is how e2e gets a clean server on each boot.
 */

export const db = getDB()
