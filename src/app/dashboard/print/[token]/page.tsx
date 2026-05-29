import { redirect, notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getTagByToken } from "@/lib/tags";
import { tagQrDataUrl } from "@/lib/qr";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintPage({ params }: { params: { token: string } }) {
  const uid = await getSessionUserId();
  if (!uid) redirect("/login");

  const tag = await getTagByToken(params.token);
  if (!tag || tag.user_id !== uid) notFound();

  const qr = await tagQrDataUrl(tag.token);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <div className="no-print mb-6 flex items-center justify-between">
        <a href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back
        </a>
        <PrintButton />
      </div>

      {/* The card to cut out and place on the dashboard. */}
      <div className="mx-auto w-[320px] rounded-2xl border-2 border-black bg-white p-6 text-center text-black">
        <p className="text-lg font-extrabold uppercase tracking-wide">Blocking my car?</p>
        <p className="mt-1 text-sm">Scan to ask me to move — politely &amp; anonymously.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Scan to notify the owner" className="mx-auto my-4 h-56 w-56" />
        <p className="text-sm font-semibold">👻🅿️ GhostTag</p>
        <p className="mt-1 text-[11px] text-gray-500">
          No phone numbers shared. The owner is notified instantly.
        </p>
        <p className="mt-2 text-[10px] text-gray-400">{tag.label}</p>
      </div>

      <p className="no-print mt-6 text-center text-sm text-slate-500">
        Print this, cut along the card edge, and place it face-out inside your windshield.
      </p>
    </main>
  );
}
