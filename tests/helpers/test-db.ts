import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';

export function createTestDatabase(): Database {
  const db = new Database(':memory:');
  db.run('PRAGMA foreign_keys = ON;');
  
  const schemaPath = new URL('../../src/database/schema.sql', import.meta.url).pathname;
  const normalizedPath = process.platform === 'win32' && schemaPath.startsWith('/') 
    ? schemaPath.slice(1) 
    : schemaPath;
  const sql = readFileSync(normalizedPath, 'utf8');
  db.exec(sql);

  return db;
}
