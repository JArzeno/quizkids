#!/usr/bin/env node
// Applies every .sql file in db/migrations in filename order, once each.
// Usage: DATABASE_URL=postgres://... npm run db:migrate
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy it from your Railway Postgres service variables.');
  process.exit(1);
}

// Railway's managed Postgres terminates TLS with a self-signed cert, so verification
// is off for external (proxy) connections. Internal connections don't use TLS at all.
const useSsl = !/[?&]sslmode=disable/.test(connectionString) && !connectionString.includes('.railway.internal');

const client = new pg.Client({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const { rows } = await client.query('select name from schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  let ran = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`- ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    // Each migration runs in its own transaction so a failure leaves nothing half-applied.
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log(`✔ ${file}`);
      ran++;
    } catch (err) {
      await client.query('rollback');
      console.error(`✘ ${file} failed — rolled back`);
      throw err;
    }
  }

  console.log(ran === 0 ? 'Database already up to date.' : `Applied ${ran} migration(s).`);
} finally {
  await client.end();
}
