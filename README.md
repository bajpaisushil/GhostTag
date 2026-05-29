# 👻🅿️ GhostTag — The Anonymous Parking Pinger

Stick a QR code in your windshield. When you block someone, they scan it, snap a
photo of how they're blocked, and tap one button. You get an **instant Telegram
alert with the photo** — and **no phone numbers are ever exchanged.**

Built to cost **₹0 to run**: Telegram's free Bot API does the notifications.

---

## How it works

1. **Owner signs in** with Telegram (recommended) or Google.
2. The app generates a unique, printable **QR tag**. Print it, stick it on the dashboard.
3. A blocked driver **scans it** → opens a clean page (no app, no signup).
4. **Anti-Spam Shield**: the page requires a **photo** of the blockage before it
   will send anything. Lazy trolls bail; genuine blocks come with proof. One
   alert per car per **15 minutes** per device/IP.
5. The owner gets the photo + "please move" message over their free channel.

**Privacy:** the scanner never sees the owner's number; the owner never sees the
scanner's. We only ever store a salted, one-way hash of the scanner's IP (for the
cooldown), never the raw IP and never who scanned.

### Notification channels (all free)

| Channel  | Login | Delivery        | Cost                        |
| -------- | ----- | --------------- | --------------------------- |
| Telegram | ✅    | Instant push 📸 | Free (Bot API)              |
| Google   | ✅    | Email w/ photo  | Free (Resend free tier)     |
| WhatsApp | ❌    | —               | Not free (paid Business API — stub only) |

> Google can't push notifications, so Google users are alerted by **email**.
> WhatsApp's programmatic sending needs Meta's paid Business API, so it's left
> as a clearly-marked stub rather than a fake "free" option.

---

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Raw self-hosted Postgres** via a pooled `pg` client — no third-party data
  layer, so it stays frugal and tunable into the millions of users
- Custom, dependency-light auth: signed-JWT session cookie (`jose`)
- `qrcode` for tag generation, Telegram Bot API + Resend for delivery

---

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
```

### 2. Postgres (self-hosted, ₹0)

The frugal default is a Postgres container you own:

```bash
docker compose up -d        # boots Postgres and auto-applies db/schema.sql
```

Then set in `.env.local`:

```
DATABASE_URL=postgres://ghosttag:ghosttag@localhost:5432/ghosttag
```

Already have a Postgres? Just apply the schema and point `DATABASE_URL` at it:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

> **Scaling to 1M+:** the app pools connections per instance (`DB_POOL_MAX`).
> When you run several app instances, enable the **PgBouncer** service in
> [docker-compose.yml](docker-compose.yml) (transaction pooling) and point the
> app at port `6432` so total Postgres connections stay bounded. The high-churn
> `pings` table is index-tuned for the cooldown probe and meant to be
> retention-trimmed — schedule the cleanup at the bottom of
> [db/schema.sql](db/schema.sql) via cron or `pg_cron`. Set `DATABASE_SSL=true`
> for any remote/managed Postgres.

### 3. Telegram bot (the free push channel)

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token →
   `TELEGRAM_BOT_TOKEN`.
2. Set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` to the bot's username (no `@`).
3. `/setdomain` in BotFather → set it to your app's host (e.g. `localhost` for
   dev) so the Login Widget works.
4. After first login, open your bot in Telegram and press **Start** once so it's
   allowed to message you.

### 4. (Optional) Google login + email pings

- Google Cloud Console → **OAuth client (Web)**. Add redirect URI
  `<NEXT_PUBLIC_APP_URL>/api/auth/google/callback`. Put the client id/secret in
  `.env.local`.
- [Resend](https://resend.com) free tier → API key + a verified `EMAIL_FROM`.

### 5. Generate a session secret

```bash
openssl rand -base64 32   # paste into AUTH_SECRET
```

### 6. Run

```bash
npm run dev   # http://localhost:3000
```

---

## Project layout

```
src/
  app/
    page.tsx                     landing
    login/                       sign-in (Telegram widget + Google)
    dashboard/                   owner: create/print/pause tags
      print/[token]/             printable windshield card
    t/[token]/                   public scan page (camera + send)
    api/
      auth/{telegram,google,logout}
      ping/                      Anti-Spam Shield endpoint
  components/                    client UI (scan form, telegram button…)
  lib/                           env, db (pooled pg), session, auth, notify, rate-limit, qr
db/schema.sql                    database schema
docker-compose.yml               self-hosted Postgres (+ optional PgBouncer)
```

## Deploy

Because it's a long-running Node server with a pooled DB connection, host it on
anything that keeps a process alive — a **₹0 VPS / Fly.io / Railway / Render**
container, or your own box:

```bash
npm run build && npm start      # serves on :3000
```

Run Postgres alongside it (the same `docker compose up -d`, or a managed PG with
`DATABASE_SSL=true`). Set `NEXT_PUBLIC_APP_URL` to your public URL, and update
BotFather `/setdomain` and the Google redirect URI to match.

> A serverless host (e.g. Vercel) also works, but pair it with PgBouncer or a
> serverless-friendly pooler — serverless functions open many short-lived
> connections that can exhaust raw Postgres.
