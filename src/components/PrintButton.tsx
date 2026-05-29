"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-ghost-accent px-4 py-2 text-sm font-semibold text-ghost-bg hover:opacity-90"
    >
      🖨️ Print
    </button>
  );
}
