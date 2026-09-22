import { NextResponse } from "next/server";
import { users } from "@/lib/mongo/collections";
import { clientIp, rateLimited } from "@/lib/server/auth";
import { verifyPassword } from "@/lib/server/password";
import { signToken } from "@/lib/server/jwt";
import { validateEmail } from "@/lib/auth-shared";

export async function POST(request: Request) {
  if (rateLimited(`login:${clientIp(request)}`, 15)) {
    return NextResponse.json({ error: "Too many tries. Please wait a moment." }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (validateEmail(email) || !password) {
    return NextResponse.json({ error: "That email and password don't match." }, { status: 400 });
  }

  const doc = await (await users()).findOne({ email });
  if (!doc || !(await verifyPassword(password, doc.passwordHash))) {
    return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
  }

  const token = await signToken({ sub: doc._id, email: doc.email, role: doc.role });
  return NextResponse.json({ ok: true, token, user: { id: doc._id, email: doc.email, name: doc.name, role: doc.role, child: doc.child } });
}
