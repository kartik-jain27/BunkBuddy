/**
 * migrate.ts — opens the local database and applies pending migrations.
 *
 * Migrations are append-only (see ./schema.ts). Each migration runs in its own
 * transaction and only then bumps PRAGMA user_version, so a failed migration
 * is never recorded as applied.
 */

import * as SQLite from 'expo-sqlite';

import { MIGRATIONS } from './schema';

export const DATABASE_NAME = 'attendance.db';

export async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    if (!sql) {
      throw new Error(`Missing migration at index ${version}.`);
    }

    const nextVersion = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${nextVersion}`);
    });

    version = nextVersion;
  }

  return db;
}
