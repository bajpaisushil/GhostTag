import { customAlphabet } from "nanoid";
import { query, queryOne, type DbTag } from "./db";

// URL-safe, unambiguous alphabet (no 0/O/1/l). 10 chars ~= 60 bits of entropy,
// so tokens are effectively unguessable.
const newToken = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 10);

// Postgres unique-violation SQLSTATE.
const UNIQUE_VIOLATION = "23505";

export async function createTag(userId: string, label: string): Promise<DbTag> {
  const clean = label.trim().slice(0, 60) || "My car";

  // Retry on the (astronomically unlikely) token collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tag = await queryOne<DbTag>(
        `INSERT INTO tags (user_id, label, token) VALUES ($1, $2, $3) RETURNING *`,
        [userId, clean, newToken()],
      );
      if (tag) return tag;
    } catch (e) {
      if ((e as { code?: string }).code !== UNIQUE_VIOLATION) throw e;
    }
  }
  throw new Error("Failed to create tag after several attempts");
}

export async function listTags(userId: string): Promise<DbTag[]> {
  return query<DbTag>(
    `SELECT * FROM tags WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
}

export async function getTagByToken(token: string): Promise<DbTag | null> {
  return queryOne<DbTag>(`SELECT * FROM tags WHERE token = $1`, [token]);
}

export async function setTagActive(userId: string, tagId: string, active: boolean): Promise<void> {
  await query(`UPDATE tags SET active = $3 WHERE id = $2 AND user_id = $1`, [
    userId,
    tagId,
    active,
  ]);
}

export async function getOwnedTag(userId: string, tagId: string): Promise<DbTag | null> {
  return queryOne<DbTag>(`SELECT * FROM tags WHERE id = $1 AND user_id = $2`, [tagId, userId]);
}
