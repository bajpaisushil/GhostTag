import Link from "next/link";
import { redirect } from "next/navigation";
import { env, features } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import TelegramLoginButton from "@/components/TelegramLoginButton";

const ERRORS: Record<string, string> = {
  telegram_disabled: "Telegram login isn't configured yet.",
  telegram_invalid: "That Telegram login couldn't be verified. Please try again.",
  google_disabled: "Google login isn't configured yet.",
  google_failed: "Google login failed. Please try again.",
  google_token: "Couldn't complete Google sign-in. Please try again.",
  google_profile: "Couldn't read your Google profile. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (await getSessionUserId()) redirect("/dashboard");

  const hasTelegram = features.telegram();
  const hasGoogle = features.google();
  const error = searchParams.error ? ERRORS[searchParams.error] ?? "Something went wrong." : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" className="text-center text-3xl font-bold">
        👻🅿️ GhostTag
      </Link>
      <p className="text-center text-slate-400">
        Sign in to create your free, anonymous parking tag.
      </p>

      {error && (
        <p className="w-full rounded-xl bg-ghost-danger/15 px-4 py-3 text-center text-sm text-ghost-danger">
          {error}
        </p>
      )}

      <div className="flex w-full flex-col items-center gap-4 rounded-2xl bg-ghost-card p-6">
        {hasTelegram ? (
          <div className="w-full">
            <p className="mb-2 text-center text-sm text-slate-400">
              Recommended — get instant push alerts.
            </p>
            <TelegramLoginButton
              botUsername={env.telegramBotUsername() as string}
              authUrl={`${env.appUrl()}/api/auth/telegram`}
            />
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Telegram login not configured. See README.md.
          </p>
        )}

        {hasGoogle && (
          <>
            <div className="flex w-full items-center gap-3 text-xs text-slate-600">
              <span className="h-px flex-1 bg-slate-700" /> or <span className="h-px flex-1 bg-slate-700" />
            </div>
            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Continue with Google
            </a>
            <p className="text-center text-xs text-slate-500">
              Google users are pinged by email instead of push.
            </p>
          </>
        )}
      </div>

      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Back home
      </Link>
    </main>
  );
}
