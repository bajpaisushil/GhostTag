import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyTelegramLogin } from "@/lib/telegram-auth";
import { upsertUser } from "@/lib/users";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// The Telegram Login Widget redirects here with the signed auth payload in the
// query string (auth-url mode). We verify the signature, create/refresh the
// user, store their chat_id so the bot can message them, then start a session.
export async function GET(req: NextRequest) {
  const token = env.telegramBotToken();
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=telegram_disabled", env.appUrl()));
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const verified = verifyTelegramLogin(params, token);
  if (!verified) {
    return NextResponse.redirect(new URL("/login?error=telegram_invalid", env.appUrl()));
  }

  const name = [verified.first_name, verified.last_name].filter(Boolean).join(" ") || verified.username || null;

  const userId = await upsertUser({
    provider: "telegram",
    providerId: verified.id,
    name,
    image: verified.photo_url ?? null,
    telegramChatId: verified.id, // chat_id with a bot equals the user's id
  });

  await createSession(userId);
  return NextResponse.redirect(new URL("/dashboard", env.appUrl()));
}
