import { queryOne, type DbUser } from "./db";
import { getSessionUserId } from "./session";

type UpsertInput = {
  provider: "telegram" | "google";
  providerId: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  telegramChatId?: string | null;
  notifyEmail?: string | null;
};

// Atomic create-or-update keyed on (provider, provider_id). Doing this in a
// single ON CONFLICT statement avoids the select-then-insert race two
// simultaneous logins could hit. COALESCE keeps an already-connected delivery
// channel instead of nulling it out on a later login that lacks it.
export async function upsertUser(input: UpsertInput): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO users (provider, provider_id, name, email, image, telegram_chat_id, notify_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (provider, provider_id) DO UPDATE SET
       name             = EXCLUDED.name,
       image            = EXCLUDED.image,
       email            = COALESCE(EXCLUDED.email, users.email),
       telegram_chat_id = COALESCE(EXCLUDED.telegram_chat_id, users.telegram_chat_id),
       notify_email     = COALESCE(EXCLUDED.notify_email, users.notify_email)
     RETURNING id`,
    [
      input.provider,
      input.providerId,
      input.name ?? null,
      input.email ?? null,
      input.image ?? null,
      input.telegramChatId ?? null,
      input.notifyEmail ?? null,
    ],
  );

  if (!row) throw new Error("Failed to upsert user");
  return row.id;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  return queryOne<DbUser>(`SELECT * FROM users WHERE id = $1`, [id]);
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  return getUserById(uid);
}
