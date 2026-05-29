import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/users";
import { getTagByToken } from "@/lib/tags";
import { notifyOwner } from "@/lib/notify";
import { clientIp, hashIp, isOnCooldown, recordPing, COOLDOWN_MINUTES } from "@/lib/rate-limit";

export const runtime = "nodejs";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

// The Anti-Spam Shield endpoint. A scan can only alert the owner by uploading a
// proof photo, and only once per 15 minutes per IP per car.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return bad("Invalid form submission.");

  const token = String(form.get("token") ?? "");
  const photo = form.get("photo");

  const tag = await getTagByToken(token);
  if (!tag || !tag.active) return bad("This tag is not active.", 404);

  // Photo proof is mandatory — this is the friction filter against trolls.
  if (!(photo instanceof Blob) || photo.size === 0) {
    return bad("A photo of how you're blocked is required.");
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return bad("That photo is too large (max 8 MB).");
  }
  if (!photo.type.startsWith("image/")) {
    return bad("Only image files are accepted.");
  }

  const ipHash = hashIp(clientIp(req.headers));

  // Cookie cooldown (soft, per-device) + server IP cooldown (hard).
  const cookieKey = `gt_${token}`;
  if (req.cookies.get(cookieKey)?.value) {
    return cooldownResponse();
  }
  if (await isOnCooldown(tag.id, ipHash)) {
    return cooldownResponse();
  }

  const owner = await getUserById(tag.user_id);
  if (!owner) return bad("Owner not found.", 404);

  const result = await notifyOwner(owner, tag.label, photo);
  await recordPing(tag.id, ipHash, result.delivered, result.channel);

  if (!result.delivered) {
    // Still record it, but tell the scanner honestly.
    return NextResponse.json(
      { ok: false, error: "Couldn't reach the owner right now. They may not have alerts set up." },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieKey, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOLDOWN_MINUTES * 60,
  });
  return res;
}

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function cooldownResponse() {
  return NextResponse.json(
    { ok: false, error: `You already alerted this car. Please wait ${COOLDOWN_MINUTES} minutes.` },
    { status: 429 },
  );
}
