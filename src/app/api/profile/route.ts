import { NextResponse } from "next/server";
import { users } from "@/lib/mongo/collections";
import { requireUser } from "@/lib/server/auth";
import { validateChild, validateName } from "@/lib/auth-shared";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const doc = await (await users()).findOne({ _id: user.id }, { projection: { email: 1, name: 1, role: 1, child: 1, settings: 1 } });
  if (!doc) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json({ profile: { id: doc._id, email: doc.email, name: doc.name, role: doc.role, child: doc.child, settings: doc.settings } });
}

// Partial update: only the fields present in the body are touched.
export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const set: Record<string, unknown> = {};

  if ("name" in b) {
    const name = typeof b.name === "string" ? b.name.trim() : "";
    if (validateName(name)) return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });
    set.name = name;
  }
  if ("child" in b) {
    const child = validateChild(b.child);
    if (!child) return NextResponse.json({ error: "Some details about your child look wrong." }, { status: 400 });
    set.child = child;
  }
  if ("settings" in b) {
    if (typeof b.settings !== "object" || b.settings === null) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
    set.settings = b.settings;
  }
  if (Object.keys(set).length === 0) return NextResponse.json({ ok: true });

  const { matchedCount } = await (await users()).updateOne({ _id: user.id }, { $set: set });
  if (matchedCount === 0) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
