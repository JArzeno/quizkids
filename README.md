# QuizKids

A Next.js study app for kids, backed by Postgres on [Railway](https://railway.app).

## Architecture

The app used to talk to Supabase directly from the browser, letting Row Level
Security decide what each parent could see. A plain Postgres database can't be
reached from a browser, so the data path changed shape:

```
browser  →  /api/*  (Next.js route handlers)  →  pg Pool  →  Railway Postgres
```

- **Auth** — email + password, hashed with bcrypt, stored in the `users` table.
  A signed JWT lives in an httpOnly `qk_session` cookie (`src/lib/auth.ts`).
- **Authorization** — every route handler re-checks ownership against the
  session (`assertOwnsKid` / `assertOwnsAssignment` in `src/lib/http.ts`). This
  is what replaced the RLS policies; there are no policies in the schema.
- **Database access** — a single pooled `pg` client in `src/lib/db.ts`. Nothing
  outside `src/app/api/**` and `src/lib/{db,auth,http}.ts` touches Postgres.
- **Client calls** — `src/lib/api.ts` is the only place the browser knows about
  API paths.

## Setup

### 1. Provision Postgres on Railway

In your Railway project: **New → Database → Add PostgreSQL**. The service's
**Variables** tab gives you two connection strings:

| Variable               | Use it for                                        |
| ---------------------- | ------------------------------------------------- |
| `DATABASE_URL`         | Services deployed inside the same Railway project (private network, no egress fees) |
| `DATABASE_PUBLIC_URL`  | Connecting from your laptop or CI                 |

### 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in:

- `DATABASE_URL` — the connection string from above.
- `AUTH_SECRET` — at least 32 characters. Generate one with `openssl rand -base64 48`.
- `OPENAI_API_KEY` — used by the `/api/generate/*` routes.

On the Railway service running the app, set the same three as service
variables. Reference the database with `${{Postgres.DATABASE_URL}}` so Railway
keeps it in sync if credentials rotate.

### 3. Create the schema

```bash
npm install
npm run db:migrate
```

`scripts/migrate.mjs` applies every file in `db/migrations` in filename order
and records what it has run in a `schema_migrations` table, so it's safe to run
repeatedly. `railway.json` runs it on each deploy before the server starts.

### 4. Run it

```bash
npm run dev
```

## Migrating existing Supabase data

Supabase is itself Postgres, so existing rows can be copied straight across.
Run the schema migration on the Railway side first, then:

```bash
SUPABASE_DATABASE_URL='postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres' \
DATABASE_URL='<your Railway DATABASE_PUBLIC_URL>' \
npm run db:import-supabase
```

What it does:

- `auth.users` + `public.profiles` are folded into the new `users` table. The
  two were always 1:1, and `profiles` existed only because Supabase owns
  `auth.users`.
- **Passwords carry over.** Supabase stores bcrypt hashes in
  `auth.users.encrypted_password`, and this app verifies with bcrypt as well, so
  everyone keeps the password they already had. Accounts that only ever used an
  OAuth provider have no hash and are skipped — this app is email + password
  only, so those need re-creating.
- `kids`, `generated_content`, `kid_assignments`, `study_sessions` and
  `quiz_results` copy over with their original ids, in foreign-key order.
- Every insert is `ON CONFLICT DO NOTHING`, so a re-run tops up rather than
  duplicating.

Once you've verified the data, remove the Supabase project and its keys.

## Schema notes

Two deliberate differences from the old Supabase schema:

- **No `auth` schema.** Accounts live in `users`, which the app writes to
  directly. The `on_auth_user_created` trigger that used to mirror new signups
  into `profiles` is gone — signup is a single insert now.
- **No RLS.** With no browser-to-database path there's nothing for policies to
  defend, and having authorization in exactly one place (the route handlers)
  beats having it in two.

## Scripts

| Command                      | What it does                                  |
| ---------------------------- | --------------------------------------------- |
| `npm run dev`                | Next.js dev server                            |
| `npm run build` / `start`    | Production build and server                   |
| `npm run typecheck`          | `tsc --noEmit`                                |
| `npm run lint`               | ESLint                                        |
| `npm run db:migrate`         | Apply pending migrations                      |
| `npm run db:import-supabase` | One-off data copy from an existing Supabase DB |
