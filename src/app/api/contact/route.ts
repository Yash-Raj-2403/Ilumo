import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { clientIp, rateLimited } from "@/lib/server/auth";
import { validateEmail, validateName } from "@/lib/auth-shared";

const BUCKET = "contact-messages";

// Public contact form. Each message is saved as a small file in a private storage bucket
// (created on first use), so it needs no extra database setup.
export async function POST(request: Request) {
  if (rateLimited(`contact:${clientIp(request)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "You've sent a few messages already. Please try again in a few minutes." }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  if (typeof b.website === "string" && b.website) return NextResponse.json({ ok: true }); // bot: pretend it worked

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (validateName(name) || validateEmail(email) || message.length < 10 || message.length > 2000) {
    return NextResponse.json({ error: "Please check your name, email and message." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const file = `${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}.json`;
  const body = JSON.stringify({ name, email, message, receivedAt: new Date().toISOString() }, null, 2);
  const upload = () => admin.storage.from(BUCKET).upload(file, body, { contentType: "application/json" });

  let { error } = await upload();
  if (error && /not found|bucket/i.test(error.message)) {
    await admin.storage.createBucket(BUCKET, { public: false });
    ({ error } = await upload());
  }
  if (error) {
    console.error("[ilumo] contact save failed:", error.message);
    return NextResponse.json({ error: "We couldn't send that right now. Please try again in a moment." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
