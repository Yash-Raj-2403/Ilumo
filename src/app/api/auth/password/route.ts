import { NextResponse } from "next/server";
import { users } from "@/lib/mongo/collections";
import { clientIp, rateLimited, requireUser } from "@/lib/server/auth";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { validateNewPassword } from "@/lib/auth-shared";

// Changes the signed-in user's password. The current password is checked server-side so the
// hash never has to leave the server.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  if (rateLimited(`password:${clientIp(request)}`, 10)) {
    return NextResponse.json({ error: "Too many tries. Please wait a moment." }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  const current = typeof b.current === "string" ? b.current : "";
  const next = typeof b.next === "string" ? b.next : "";
  const err = validateNewPassword(next);
  if (!current || err) return NextResponse.json({ error: err ?? "Please enter your current password." }, { status: 400 });

  const col = await users();
  const doc = await col.findOne({ _id: user.id }, { projection: { passwordHash: 1 } });
  if (!doc || !(await verifyPassword(current, doc.passwordHash))) {
    return NextResponse.json({ error: "That isn't your current password." }, { status: 401 });
  }
  await col.updateOne({ _id: user.id }, { $set: { passwordHash: await hashPassword(next) } });
  return NextResponse.json({ ok: true });
}
