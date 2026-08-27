import { Pool, type QueryResultRow } from 'pg';

// One pool per server process. Next dev reloads the module graph on every edit,
// so the pool is stashed on globalThis to avoid leaking a pool per reload.
const globalForDb = globalThis as unknown as { qkPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — point it at your Railway Postgres service.');
  }

  // Railway's managed Postgres terminates TLS with a self-signed cert on the public
  // proxy host, so verification is off there. Internal (*.railway.internal) traffic
  // never leaves the private network and doesn't use TLS at all.
  const useSsl =
    !/[?&]sslmode=disable/.test(connectionString) && !connectionString.includes('.railway.internal');

  return new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalForDb.qkPool) globalForDb.qkPool = createPool();
  return globalForDb.qkPool;
}

/** Run a parameterised query and get the rows back. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query<T>(text, params);
  return res.rows;
}

/** Run a query expected to match at most one row. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run a set of statements in a single transaction. */
export async function transaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
