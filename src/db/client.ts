import { Database } from 'bun:sqlite'
import { readFileSync } from 'node:fs'

let db: Database | null = null

export function initDb(path: string): Database {
    db = new Database(path, { create: true })
    db.run('PRAGMA journal_mode = WAL;')
    db.run('PRAGMA foreign_keys = ON;')
    const schema = readFileSync(
        new URL('./schema.sql', import.meta.url), 'utf-8')
    db.run(schema)
    return db
}

export function getDb(): Database {
    if (!db) throw new Error(
        'Database not initialized — call initDb() first')
    return db
}