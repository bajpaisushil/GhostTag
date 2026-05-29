import { notFound } from "next/navigation";
import { getTagByToken } from "@/lib/tags";
import ScanForm from "@/components/ScanForm";

export const dynamic = "force-dynamic";

// The page a blocked driver lands on after scanning the windshield QR.
// No login, no app install — just take a proof photo and tap send.
export default async function ScanPage({ params }: { params: { token: string } }) {
  const tag = await getTagByToken(params.token);
  if (!tag) notFound();

  if (!tag.active) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🚫</div>
        <h1 className="text-xl font-semibold">This tag is paused</h1>
        <p className="text-slate-400">The owner has temporarily turned off alerts for this car.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <div className="text-5xl">🚗</div>
        <h1 className="mt-2 text-2xl font-bold">Blocked in?</h1>
        <p className="mt-2 text-slate-400">
          Snap a photo showing how this car is blocking you. We&apos;ll send it straight to the owner
          — <span className="text-ghost-accent">anonymously</span>. No numbers shared, ever.
        </p>
      </div>
      <ScanForm token={tag.token} />
      <p className="text-center text-xs text-slate-600">
        A photo is required so owners can tell real blocks from pranks. One alert per car every 15
        minutes.
      </p>
    </main>
  );
}
