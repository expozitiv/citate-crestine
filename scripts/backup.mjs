/**
 * Backup PostgreSQL independent de aplicație (vezi SPECIFICATII-TEHNICE.md / Backup).
 * Rulează pg_dump peste DATABASE_URI și salvează în ./backups/ cu timestamp.
 *
 *   npm run backup:db
 *
 * Necesită pg_dump în PATH (PostgreSQL client tools). Recomandat: rulat periodic
 * (cron / GitHub Actions) pe lângă backup-urile automate din Supabase.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const { config } = await import('dotenv')
config()

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('DATABASE_URI lipsește din mediu / .env')
  process.exit(1)
}

const dir = path.resolve('backups')
mkdirSync(dir, { recursive: true })

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
const fisier = path.join(dir, `citate-${stamp}.dump`)

const rezultat = spawnSync('pg_dump', ['--format=custom', `--file=${fisier}`, uri], {
  stdio: 'inherit',
})

if (rezultat.status !== 0) {
  console.error('pg_dump a eșuat — verifică instalarea PostgreSQL client tools.')
  process.exit(rezultat.status ?? 1)
}
console.log(`Backup salvat: ${fisier}`)
console.log('Restaurare: pg_restore --clean --if-exists -d $DATABASE_URI ' + fisier)
