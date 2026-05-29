import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/users";
import { listTags } from "@/lib/tags";
import { tagQrDataUrl, tagUrl } from "@/lib/qr";
import { features } from "@/lib/env";
import { createTagAction, toggleTagAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tags = await listTags(user.id);
  const qrByToken = Object.fromEntries(
    await Promise.all(tags.map(async (t) => [t.token, await tagQrDataUrl(t.token)] as const)),
  );

  const channel = user.telegram_chat_id
    ? { label: "Telegram", detail: "Instant push alerts." }
    : user.notify_email
      ? { label: "Email", detail: user.notify_email }
      : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your GhostTags</h1>
          <p className="text-sm text-slate-400">Signed in as {user.name ?? user.email ?? "you"}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-slate-400 hover:text-slate-200">Log out</button>
        </form>
      </header>

      {/* Delivery channel status */}
      <section className="mb-8 rounded-2xl bg-ghost-card p-5">
        <h2 className="text-sm font-semibold text-slate-300">How you&apos;ll be alerted</h2>
        {channel ? (
          <p className="mt-1 text-sm">
            <span className="font-medium text-ghost-accent">{channel.label}</span>{" "}
            <span className="text-slate-400">— {channel.detail}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-ghost-danger">
            No notification channel connected — pings won&apos;t reach you. Sign in with Telegram for
            instant alerts.
          </p>
        )}
        {user.telegram_chat_id && features.telegram() && (
          <p className="mt-2 text-xs text-slate-500">
            Tip: open your bot in Telegram and press <strong>Start</strong> once so it&apos;s allowed
            to message you.
          </p>
        )}
      </section>

      {/* Create a tag */}
      <form action={createTagAction} className="mb-8 flex gap-2">
        <input
          name="label"
          placeholder="Label (e.g. White Swift DL-3C)"
          maxLength={60}
          className="flex-1 rounded-xl bg-ghost-card px-4 py-3 text-sm outline-none ring-1 ring-slate-700 focus:ring-ghost-accent"
        />
        <button className="rounded-xl bg-ghost-accent px-5 py-3 text-sm font-semibold text-ghost-bg hover:opacity-90">
          + New tag
        </button>
      </form>

      {/* Tag list */}
      {tags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          No tags yet. Create one above, then print it and stick it in your windshield.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tags.map((tag) => (
            <li key={tag.id} className="rounded-2xl bg-ghost-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{tag.label}</p>
                  <p className="break-all text-xs text-slate-500">{tagUrl(tag.token)}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    tag.active ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-600/30 text-slate-400"
                  }`}
                >
                  {tag.active ? "Active" : "Paused"}
                </span>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrByToken[tag.token]}
                alt={`QR code for ${tag.label}`}
                className="mx-auto my-4 h-40 w-40 rounded-lg bg-white p-2"
              />

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/print/${tag.token}`}
                  className="flex-1 rounded-lg bg-ghost-accent/90 py-2 text-center text-sm font-medium text-ghost-bg hover:bg-ghost-accent"
                >
                  Print
                </Link>
                <form action={toggleTagAction} className="flex-1">
                  <input type="hidden" name="tagId" value={tag.id} />
                  <input type="hidden" name="active" value={(!tag.active).toString()} />
                  <button className="w-full rounded-lg bg-slate-700/60 py-2 text-sm font-medium hover:bg-slate-700">
                    {tag.active ? "Pause" : "Activate"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
