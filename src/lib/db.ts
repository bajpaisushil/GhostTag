import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { env } from "./env";

// Raw, self-hosted Postgres access via a single pooled connection.
// No third-party data layer — just `pg`. Security comes from the database not
// being publicly exposed plus our own app-level auth, so there is no RLS to
// work around (we connect as a normal owning role).
//
// In dev, Next.js hot-reload re-evaluates modules; we stash the pool on
// globalThis so we don't leak a new pool (and its connections) on every reload.

const globalForDb = globalThis as unknown as { __ghosttagPool?: Pool };

export function pool(): Pool {
  if (globalForDb.__ghosttagPool) return globalForDb.__ghosttagPool;

  const p = new Pool({
    connectionString: env.databaseUrl(),
    // Per-instance cap. Behind several app instances, front Postgres with
    // PgBouncer (transaction pooling) so total connections stay bounded at scale.
    max: env.dbPoolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: env.dbSsl() ? { rejectUnauthorized: false } : undefined,
  });
  // Don't let a backend error on an idle client crash the process.
  p.on("error", (err) => console.error("[db] idle client error:", err.message));

  globalForDb.__ghosttagPool = p;
  return p;
}

// Run a parameterized query. ALWAYS pass values via `params` ($1, $2, …) —
// never interpolate into the SQL string — so we stay injection-safe.
export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool().query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export type DbUser = {
  id: string;
  provider: "telegram" | "google";
  provider_id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  telegram_chat_id: string | null;
  notify_email: string | null;
  created_at: string;
};

export type DbTag = {
  id: string;
  token: string;
  user_id: string;
  label: string;
  active: boolean;
  created_at: string;
};
