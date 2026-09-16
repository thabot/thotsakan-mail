import { Database } from 'bun:sqlite';
import { getEnv } from '../config/env.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

let _db: Database | null = null;

export function getDatabase(customPath?: string): Database {
  if (!_db) {
    const dbPath = customPath || getEnv().DB_PATH;
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(dbPath), { recursive: true });
    }
    _db = new Database(dbPath);
    
    // Configure SQLite for high concurrency & enterprise reliability
    _db.run('PRAGMA journal_mode = WAL;');
    _db.run('PRAGMA foreign_keys = ON;');
    _db.run('PRAGMA busy_timeout = 5000;');
    _db.run('PRAGMA synchronous = NORMAL;');
  }
  return _db;
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function runMigrations(db: Database): void {
  const schemaPath = new URL('./schema.sql', import.meta.url).pathname;
  // Handle Windows paths if necessary
  const normalizedPath = process.platform === 'win32' && schemaPath.startsWith('/') 
    ? schemaPath.slice(1) 
    : schemaPath;
  const sql = readFileSync(normalizedPath, 'utf8');
  db.exec(sql);
}
