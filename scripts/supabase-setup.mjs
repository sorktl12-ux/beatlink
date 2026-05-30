#!/usr/bin/env node
/**
 * One-time Supabase setup (local machine only).
 * Requires .env.admin with SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DB_URL.
 * Never commit .env.admin.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ADMIN_ID = 'sorktl12'
const PW_SUFFIX = '~beatlink'
const BASE = 'https://dkmrvavkzwtbqzttcmiz.supabase.co'

function loadAdminEnv() {
  const path = resolve(root, '.env.admin')
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

function genPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'Bl'
  for (let i = 0; i < 14; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s + '!9'
}

async function runSql(dbUrl, filePath) {
  const sql = readFileSync(filePath, 'utf8')
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
  } finally {
    await client.end()
  }
}

async function main() {
  const adminEnv = loadAdminEnv()
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY || adminEnv.SUPABASE_SERVICE_ROLE_KEY
  const dbUrl = process.env.SUPABASE_DB_URL || adminEnv.SUPABASE_DB_URL

  if (!sr) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY (.env.admin or env)')
    process.exit(1)
  }

  const sb = createClient(BASE, sr, { auth: { persistSession: false, autoRefreshToken: false } })

  // 1) SQL migration
  const migration = resolve(root, 'supabase/migrations/20260530_cleanup_security.sql')
  if (dbUrl) {
    console.log('▶ Running SQL migration…')
    await runSql(dbUrl, migration)
    console.log('✓ SQL migration complete')
  } else {
    console.warn('⚠ SUPABASE_DB_URL not set — skipping SQL (run migration in SQL Editor)')
  }

  // 2) Admin profile
  console.log('▶ Ensuring admin profile…')
  const { data: profiles, error: pErr } = await sb
    .from('profiles')
    .select('id, username, role, seller_approved')
    .eq('username', ADMIN_ID)
  if (pErr) throw pErr
  if (!profiles?.length) throw new Error(`No profile for ${ADMIN_ID}`)
  const { error: upErr } = await sb
    .from('profiles')
    .update({ role: 'admin', seller_approved: true })
    .eq('username', ADMIN_ID)
  if (upErr) throw upErr
  console.log('✓ Admin profile: role=admin, seller_approved=true')

  // 3) Reset admin auth password
  console.log('▶ Resetting admin login password…')
  const { data: usersData, error: uErr } = await sb.auth.admin.listUsers({ perPage: 200 })
  if (uErr) throw uErr
  const adminUser = usersData.users.find((u) => u.email === `${ADMIN_ID}@beatlink.app`)
  if (!adminUser) throw new Error('Admin auth user not found')

  const plainPw = genPassword()
  const dbPw = `${plainPw}${PW_SUFFIX}`
  const { error: pwErr } = await sb.auth.admin.updateUserById(adminUser.id, { password: dbPw })
  if (pwErr) throw pwErr

  const credPath = resolve(root, '.admin-credentials.local')
  writeFileSync(
    credPath,
    `# BEATLINK admin login (gitignored — this machine only)\n# Created: ${new Date().toISOString()}\nID: ${ADMIN_ID}\nPassword: ${plainPw}\n`,
    'utf8'
  )
  console.log(`✓ Admin password reset → ${credPath}`)

  // 4) Verify columns
  const { error: colErr } = await sb.from('posts').select('engineer_mix_scope, recruit_count').limit(1)
  if (colErr) throw new Error(`posts columns check failed: ${colErr.message}`)
  console.log('✓ posts.engineer_mix_scope / recruit_count OK')

  console.log('\n✓ Supabase setup complete')
}

main().catch((err) => {
  console.error('✗', err.message || err)
  process.exit(1)
})
