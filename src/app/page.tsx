import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div>
        <div className="mb-3 text-5xl">👻🅿️</div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">GhostTag</h1>
        <p className="mt-4 text-lg text-slate-300">
          The anonymous parking pinger. Stick a QR code in your windshield. When you block someone,
          they tap one button to ask you to move —{" "}
          <span className="text-ghost-accent">no phone numbers are ever exchanged.</span>
        </p>
      </div>

      <ol className="grid w-full gap-4 text-left sm:grid-cols-3">
        {[
          ["1. Sign in", "Use Telegram or Google. Takes 5 seconds."],
          ["2. Print your QR", "Generate a tag and stick it on your dashboard."],
          ["3. Get pinged", "A blocked driver taps once — you get an instant alert."],
        ].map(([title, body]) => (
          <li key={title} className="rounded-2xl bg-ghost-card p-5">
            <p className="font-semibold text-ghost-accent">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{body}</p>
          </li>
        ))}
      </ol>

      <Link
        href="/login"
        className="rounded-full bg-ghost-accent px-8 py-4 text-lg font-semibold text-ghost-bg transition hover:opacity-90"
      >
        Get my free GhostTag →
      </Link>

      <p className="max-w-md text-xs text-slate-500">
        Free forever. We never see the scanner&apos;s number, and the scanner never sees yours.
        Notifications run on Telegram&apos;s free bot API.
      </p>
    </main>
  );
}
