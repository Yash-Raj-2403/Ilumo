import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { users } from "@/lib/mongo/collections";
import { clientIp, rateLimited } from "@/lib/server/auth";
import { hashPassword } from "@/lib/server/password";
import { signToken } from "@/lib/server/jwt";
import { normalizeSupports, validateEmail, validateName, validateNewPassword } from "@/lib/auth-shared";

// Creates the account and signs the person in immediately, so the client doesn't need a
// separate login call. The email is trusted (no verification link) so the demo doesn't
// depend on email delivery.
export async function POST(request: Request) {
  if (rateLimited(`signup:${clientIp(request)}`, 8)) {
    return NextResponse.json({ error: "Too many tries. Please wait a moment." }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const role = b.role === "student" || b.role === "parent" ? b.role : null;
  // Students say which support they need; parents add their child (with their own account) later.
  const supports = role === "student" ? normalizeSupports(b.supports) : [];

  if (validateEmail(email) || validateName(name) || validateNewPassword(password) || !role || (role === "student" && supports.length === 0)) {
    return NextResponse.json({ error: "Some details look wrong. Please go back and check them." }, { status: 400 });
  }

  const col = await users();
  if (await col.findOne({ email }, { projection: { _id: 1 } })) {
    return NextResponse.json({ error: "That email already has an ILUMO account." }, { status: 409 });
  }

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  try {
    await col.insertOne({
      _id: id, email, passwordHash, name, role,
      child: null, settings: { supports }, childIds: [], parentId: null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Unique index race: someone else signed up with this email a moment ago.
    if (err instanceof Error && /E11000/.test(err.message)) {
      return NextResponse.json({ error: "That email already has an ILUMO account." }, { status: 409 });
    }
    console.error("[ilumo] signup failed:", err);
    return NextResponse.json({ error: "We couldn't create your account right now.", code: "db_unavailable" }, { status: 503 });
  }

  const token = await signToken({ sub: id, email, role });
  return NextResponse.json({ ok: true, token, user: { id, email, name, role, child: null } });
}
