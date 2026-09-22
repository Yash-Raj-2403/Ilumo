import { NextResponse } from "next/server";
import { users } from "@/lib/mongo/collections";
import { requireUser } from "@/lib/server/auth";
import { signToken } from "@/lib/server/jwt";
import { validateEmail } from "@/lib/auth-shared";

// Change the signed-in user's email. Returns a fresh token (it carries the email as a claim)
// so the client's session stays in sync without a re-login.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (validateEmail(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (email === user.email.toLowerCase()) return NextResponse.json({ ok: true, token: null });

  const col = await users();
  const taken = await col.findOne({ email }, { projection: { _id: 1 } });
  if (taken) return NextResponse.json({ error: "That email already has an ILUMO account." }, { status: 409 });

  const { matchedCount } = await col.updateOne({ _id: user.id }, { $set: { email } });
  if (matchedCount === 0) return NextResponse.json({ error: "We couldn't change your email right now." }, { status: 502 });

  const token = await signToken({ sub: user.id, email, role: user.role });
  return NextResponse.json({ ok: true, token });
}
