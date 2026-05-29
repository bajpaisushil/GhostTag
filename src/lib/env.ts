// Central place to read environment variables so missing config fails loudly
// with a helpful message instead of a confusing runtime error deep in a request.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in (see README.md).`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  // Public base URL, e.g. http://localhost:3000 or https://ghosttag.vercel.app
  appUrl: () => required("NEXT_PUBLIC_APP_URL"),

  // Postgres (self-hosted or managed). e.g.
  // postgres://user:pass@host:5432/ghosttag
  databaseUrl: () => required("DATABASE_URL"),
  // Max pooled connections per app instance.
  dbPoolMax: () => Number(process.env.DB_POOL_MAX ?? "10"),
  // Enable TLS to Postgres (set DATABASE_SSL=true for managed/remote PG).
  dbSsl: () =>
    process.env.DATABASE_SSL === "true" ||
    /[?&]sslmode=require/.test(process.env.DATABASE_URL ?? ""),

  // Session signing
  authSecret: () => required("AUTH_SECRET"),

  // Telegram (login widget + bot)
  telegramBotToken: () => optional("TELEGRAM_BOT_TOKEN"),
  telegramBotUsername: () => optional("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"),

  // Google OAuth (login only)
  googleClientId: () => optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: () => optional("GOOGLE_CLIENT_SECRET"),

  // Email fallback (Resend free tier)
  resendApiKey: () => optional("RESEND_API_KEY"),
  emailFrom: () => optional("EMAIL_FROM"),
};

// Feature flags derived from which credentials are present.
export const features = {
  telegram: () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME),
  google: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  email: () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
};
