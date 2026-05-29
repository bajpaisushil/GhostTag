import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { clearSession } from "@/lib/session";

export async function POST() {
  clearSession();
  return NextResponse.redirect(new URL("/", env.appUrl()), { status: 303 });
}
