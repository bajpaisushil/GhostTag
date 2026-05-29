"use client";

import { useRef, useState } from "react";

type Status = "idle" | "ready" | "sending" | "sent" | "error";

export default function ScanForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const fileObj = useRef<File | null>(null);

  function onPhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    fileObj.current = file;
    setPreview(URL.createObjectURL(file));
    setStatus("ready");
    setMessage("");
  }

  async function send() {
    if (!fileObj.current) return;
    setStatus("sending");
    setMessage("");

    const body = new FormData();
    body.append("token", token);
    body.append("photo", fileObj.current);

    try {
      const res = await fetch("/api/ping", { method: "POST", body });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-emerald-500/10 p-8 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-3 text-xl font-semibold text-emerald-400">Alert sent!</h2>
        <p className="mt-2 text-slate-300">
          The owner just got your photo and a request to move. Hang tight — they&apos;re on their way.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoChosen}
        className="hidden"
      />

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Your proof photo"
          className="max-h-72 w-full rounded-2xl object-cover"
        />
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-600 text-slate-300 transition hover:border-ghost-accent hover:text-ghost-accent"
        >
          <span className="text-4xl">📸</span>
          <span className="font-medium">Tap to take a photo</span>
        </button>
      )}

      {status === "error" && (
        <p className="rounded-xl bg-ghost-danger/15 px-4 py-3 text-center text-sm text-ghost-danger">
          {message}
        </p>
      )}

      {preview && (
        <button
          onClick={() => fileRef.current?.click()}
          className="text-center text-sm text-slate-400 underline-offset-2 hover:underline"
        >
          Retake photo
        </button>
      )}

      <button
        onClick={send}
        disabled={status !== "ready" && status !== "error"}
        className="rounded-2xl bg-ghost-danger py-5 text-xl font-bold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "sending"
          ? "Sending…"
          : preview
            ? "🔔 Please move your car"
            : "Take a photo first"}
      </button>
    </div>
  );
}
