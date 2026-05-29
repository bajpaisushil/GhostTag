"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { createTag, setTagActive } from "@/lib/tags";

export async function createTagAction(formData: FormData) {
  const uid = await getSessionUserId();
  if (!uid) redirect("/login");

  const label = String(formData.get("label") ?? "");
  await createTag(uid, label);
  revalidatePath("/dashboard");
}

export async function toggleTagAction(formData: FormData) {
  const uid = await getSessionUserId();
  if (!uid) redirect("/login");

  const tagId = String(formData.get("tagId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (tagId) await setTagActive(uid, tagId, active);
  revalidatePath("/dashboard");
}
