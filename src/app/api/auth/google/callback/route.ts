import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { upsertUser } from "@/lib/users";
import { createSession } from "@/lib/session";

type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export const dynamic = "force-dynamic";

// Step 2 of Google OAuth: exchange the code for tokens, read the profile,
// then create/refresh the user and store their email as the ping channel.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const clientId = env.googleClientId();
  const clientSecret = env.googleClientSecret();

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_failed", env.appUrl()));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${env.appUrl()}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=google_token", env.appUrl()));
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/login?error=google_token", env.appUrl()));
  }

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) {
    return NextResponse.redirect(new URL("/login?error=google_profile", env.appUrl()));
  }
  const info = (await infoRes.json()) as GoogleUserInfo;

  const userId = await upsertUser({
    provider: "google",
    providerId: info.sub,
    name: info.name ?? null,
    email: info.email ?? null,
    image: info.picture ?? null,
    notifyEmail: info.email_verified ? info.email ?? null : null,
  });

  await createSession(userId);
  return NextResponse.redirect(new URL("/dashboard", env.appUrl()));
}
