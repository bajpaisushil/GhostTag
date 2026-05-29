import crypto from "crypto";
import { query, queryOne } from "./db";
import { env } from "./env";

export const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
export const COOLDOWN_MINUTES = 15;

// One-way, salted hash of the scanner's IP. We store this (never the raw IP)
// purely to throttle repeat alerts to the same car. Not reversible.
export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(`${env.authSecret()}:${ip}`).digest("hex");
}

// Best-effort client IP from common proxy headers (Vercel, nginx, etc.).
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

// Server-side cooldown: has this IP already pinged this tag within the window?
// EXISTS short-circuits and the (tag_id, ip_hash, created_at) index makes this
// an index-only probe even with a huge pings table.
export async function isOnCooldown(tagId: string, ipHash: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pings
       WHERE tag_id = $1 AND ip_hash = $2
         AND created_at >= now() - ($3 || ' milliseconds')::interval
     ) AS exists`,
    [tagId, ipHash, COOLDOWN_MS],
  );
  return Boolean(row?.exists);
}

export async function recordPing(
  tagId: string,
  ipHash: string,
  delivered: boolean,
  channel: string | null,
): Promise<void> {
  await query(
    `INSERT INTO pings (tag_id, ip_hash, delivered, channel) VALUES ($1, $2, $3, $4)`,
    [tagId, ipHash, delivered, channel],
  );
}
