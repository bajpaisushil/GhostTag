import { env } from "./env";
import type { DbUser } from "./db";

export type DeliveryResult = { delivered: boolean; channel: string | null; error?: string };

// Send the "please move your car" alert — WITH the proof photo the scanner was
// required to take — to the owner over whichever free channel they connected.
// Telegram is preferred (instant push + inline photo); email is the fallback.
export async function notifyOwner(
  owner: DbUser,
  label: string,
  photo: Blob,
): Promise<DeliveryResult> {
  const caption =
    `🚗 GhostTag alert for "${label}"\n\n` +
    `Someone says your car is blocking them — photo proof attached.\n` +
    `Please move it when you can. (They never see your number, you never see theirs.)`;

  if (owner.telegram_chat_id && env.telegramBotToken()) {
    const r = await sendTelegramPhoto(owner.telegram_chat_id, caption, photo);
    if (r.delivered) return r;
    // fall through to email if Telegram failed (e.g. owner never pressed Start)
  }

  if (owner.notify_email && env.resendApiKey() && env.emailFrom()) {
    return sendEmailWithPhoto(owner.notify_email, label, caption, photo);
  }

  return { delivered: false, channel: null, error: "Owner has no connected notification channel" };
}

async function sendTelegramPhoto(chatId: string, caption: string, photo: Blob): Promise<DeliveryResult> {
  try {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", caption);
    form.append("photo", photo, "proof.jpg");

    const res = await fetch(`https://api.telegram.org/bot${env.telegramBotToken()}/sendPhoto`, {
      method: "POST",
      body: form,
    });
    const body = (await res.json()) as { ok: boolean; description?: string };
    if (body.ok) return { delivered: true, channel: "telegram" };
    return { delivered: false, channel: "telegram", error: body.description };
  } catch (e) {
    return { delivered: false, channel: "telegram", error: (e as Error).message };
  }
}

async function sendEmailWithPhoto(
  to: string,
  label: string,
  text: string,
  photo: Blob,
): Promise<DeliveryResult> {
  try {
    const base64 = Buffer.from(await photo.arrayBuffer()).toString("base64");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resendApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFrom(),
        to,
        subject: `🚗 Someone needs you to move "${label}"`,
        text,
        attachments: [{ filename: "proof.jpg", content: base64 }],
      }),
    });
    if (res.ok) return { delivered: true, channel: "email" };
    return { delivered: false, channel: "email", error: await res.text() };
  } catch (e) {
    return { delivered: false, channel: "email", error: (e as Error).message };
  }
}
