#!/usr/bin/env node
/**
 * One-off copy of an existing Supabase database into Railway Postgres.
 *
 * Run the schema migration on the Railway side first (`npm run db:migrate`),
 * then:
 *
 *   SUPABASE_DATABASE_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres \
 *   DATABASE_URL=postgresql://postgres:...@<host>.proxy.rlwy.net:<port>/railway \
 *   node scripts/import-from-supabase.mjs
 *
 * Passwords carry over as-is: Supabase stores bcrypt hashes in
 * auth.users.encrypted_password, and this app verifies with bcrypt too, so
 * everyone keeps their existing password. Accounts that only ever signed in
 * through an OAuth provider have no password hash and are skipped — they'll
 * need to be re-created, since this app is email + password only.
 *
 * Re-running is safe: every insert is ON CONFLICT DO NOTHING.
 */
import pg from 'pg';

const source = process.env.SUPABASE_DATABASE_URL;
const target = process.env.DATABASE_URL;

if (!source || !target) {
  console.error('Set both SUPABASE_DATABASE_URL and DATABASE_URL.');
  process.exit(1);
}

const connect = async (connectionString) => {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
};

const src = await connect(source);
const dst = await connect(target);

const copied = {};

async function copy(label, selectSql, insertSql, toValues) {
  const { rows } = await src.query(selectSql);
  let n = 0;
  for (const row of rows) {
    const res = await dst.query(insertSql, toValues(row));
    n += res.rowCount ?? 0;
  }
  copied[label] = `${n} of ${rows.length}`;
  console.log(`${label}: inserted ${n} of ${rows.length} row(s)`);
}

try {
  // users ← auth.users joined with the old public.profiles sidecar
  await copy(
    'users',
    `select u.id,
            u.email,
            u.encrypted_password,
            coalesce(p.name, u.raw_user_meta_data->>'name') as name,
            p.role, p.parent_prefs, p.parent_pin, p.plan, p.plan_cycle, p.plan_since,
            u.created_at
       from auth.users u
       left join public.profiles p on p.id = u.id
      where u.encrypted_password is not null and u.email is not null`,
    `insert into users (id, email, password_hash, name, role, parent_prefs, parent_pin, plan, plan_cycle, plan_since, created_at)
     values ($1, lower($2), $3, $4, coalesce($5,'parent'), coalesce($6::jsonb,'{}'::jsonb), coalesce($7,'1234'),
             coalesce($8,'family'), coalesce($9,'monthly'), $10, coalesce($11::timestamptz, now()))
     on conflict (id) do nothing`,
    (r) => [r.id, r.email, r.encrypted_password, r.name, r.role, r.parent_prefs, r.parent_pin,
            r.plan, r.plan_cycle, r.plan_since, r.created_at]
  );

  await copy(
    'kids',
    `select * from public.kids where parent_id in (select id from auth.users where encrypted_password is not null)`,
    `insert into kids (id, parent_id, name, grade, avatar, color, code, goal_min, streak, stars,
                       minutes_total, weekly_pct, last_subject, signature, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,coalesce($15::timestamptz, now()))
     on conflict (id) do nothing`,
    (r) => [r.id, r.parent_id, r.name, r.grade, r.avatar, r.color, r.code, r.goal_min, r.streak,
            r.stars, r.minutes_total, r.weekly_pct, r.last_subject, r.signature, r.created_at]
  );

  await copy(
    'generated_content',
    'select * from public.generated_content',
    `insert into generated_content (id, subject, topic, grade, difficulty, lang, type, content, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,coalesce($9::timestamptz, now()))
     on conflict (id) do nothing`,
    (r) => [r.id, r.subject, r.topic, r.grade, r.difficulty, r.lang, r.type, r.content, r.created_at]
  );

  await copy(
    'kid_assignments',
    'select * from public.kid_assignments where kid_id in (select id from public.kids)',
    `insert into kid_assignments (id, kid_id, content_id, subject, topic, grade, type, status, assigned_at)
     values ($1,$2,$3,$4,$5,$6,$7,coalesce($8,'pending'),coalesce($9::timestamptz, now()))
     on conflict (id) do nothing`,
    (r) => [r.id, r.kid_id, r.content_id, r.subject, r.topic, r.grade, r.type, r.status, r.assigned_at]
  );

  await copy(
    'study_sessions',
    'select * from public.study_sessions where kid_id in (select id from public.kids)',
    `insert into study_sessions (id, kid_id, started_at, ended_at, minutes)
     values ($1,$2,coalesce($3::timestamptz, now()),$4,$5)
     on conflict (id) do nothing`,
    (r) => [r.id, r.kid_id, r.started_at, r.ended_at, r.minutes]
  );

  // quiz_results.assignment_id was a bare uuid in Supabase (no foreign key). It's a
  // real reference now, so dangling ids are nulled out rather than failing the insert.
  await copy(
    'quiz_results',
    'select * from public.quiz_results where kid_id in (select id from public.kids)',
    `insert into quiz_results (id, kid_id, assignment_id, subject, topic, grade, difficulty,
                               total, correct, stars, lang, created_at)
     values ($1,$2,(select id from kid_assignments where id = $3),$4,$5,$6,$7,$8,$9,$10,$11,coalesce($12::timestamptz, now()))
     on conflict (id) do nothing`,
    (r) => [r.id, r.kid_id, r.assignment_id, r.subject, r.topic, r.grade, r.difficulty,
            r.total, r.correct, r.stars, r.lang, r.created_at]
  );

  console.log('\nImport complete:', copied);
} finally {
  await src.end();
  await dst.end();
}
