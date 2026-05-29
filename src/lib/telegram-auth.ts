import crypto from "crypto";

// Verifies the payload from the Telegram Login Widget.
// Telegram signs the data with HMAC-SHA256 using SHA256(bot_token) as the key.
// See https://core.telegram.org/widgets/login#checking-authorization
export type TelegramAuthData = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

export function verifyTelegramLogin(
  data: Record<string, string>,
  botToken: string,
): TelegramAuthData | null {
  const { hash, ...rest } = data;
  if (!hash || !rest.id || !rest.auth_date) return null;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  // Constant-time compare.
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  // Reject logins older than 24h to limit replay.
  const authDate = Number(rest.auth_date) * 1000;
  if (Number.isNaN(authDate) || Date.now() - authDate > 24 * 60 * 60 * 1000) return null;

  return { ...(rest as Omit<TelegramAuthData, "hash">), hash } as TelegramAuthData;
}
