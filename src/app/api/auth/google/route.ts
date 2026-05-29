import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// Step 1 of Google OAuth: redirect the user to Google's consent screen.
// We only request basic profile + email (login + the email we ping).
export async function GET() {
  const clientId = env.googleClientId();
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_disabled", env.appUrl()));
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${env.appUrl()}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(url);
}
