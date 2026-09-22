import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { contactMessages } from "@/lib/mongo/collections";
import { clientIp, rateLimited } from "@/lib/server/auth";
import { validateEmail, validateName } from "@/lib/auth-shared";

// Public contact form. Each message is saved as its own document.
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

  try {
    const receivedAt = new Date().toISOString();
    await (await contactMessages()).insertOne({ _id: randomUUID(), name, email, message, receivedAt });
  } catch (err) {
    console.error("[ilumo] contact save failed:", err);
    return NextResponse.json({ error: "We couldn't send that right now. Please try again in a moment." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
