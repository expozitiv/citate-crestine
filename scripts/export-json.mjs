/**
 * Backup JSON al conținutului (fără pg_dump): autori, carti, teme, citate, citate_rels.
 * Salvează în ./backups/continut-<timestamp>.json. Folosit înaintea importurilor mari.
 *
 *   node scripts/export-json.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { config } from 'dotenv'
import pg from 'pg'

config()

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('DATABASE_URI lipsește din mediu / .env')
  process.exit(1)
}

const client = new pg.Client({ connectionString: uri })
await client.connect()

const tabele = ['autori', 'carti', 'teme', 'citate', 'citate_rels']
const out = {}
for (const t of tabele) {
  const r = await client.query(`select * from "${t}" order by id`)
  out[t] = r.rows
  console.log(`${t}: ${r.rows.length} rânduri`)
}
await client.end()

const dir = path.resolve('backups')
mkdirSync(dir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
const fisier = path.join(dir, `continut-${stamp}.json`)
writeFileSync(fisier, JSON.stringify(out))
console.log(`Backup salvat: ${fisier}`)
