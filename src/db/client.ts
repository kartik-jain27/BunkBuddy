/**
 * client.ts — the single open SQLite connection.
 *
 * DatabaseProvider calls setDatabase() once the database is migrated. The
 * repository functions read it from here so their signatures stay simple.
 * This file contains no SQL.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

let database: SQLiteDatabase | null = null;

export function setDatabase(db: SQLiteDatabase | null): void {
  database = db;
}

export function getDatabase(): SQLiteDatabase {
  if (!database) {
    throw new Error('The database is not ready yet.');
  }
  return database;
}
