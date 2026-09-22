import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { users } from "@/lib/mongo/collections";
import { rateLimited, requireParent } from "@/lib/server/auth";
import { hashPassword } from "@/lib/server/password";
import { childIdsOf, childSummary, isMyChild } from "@/lib/server/children";
import { normalizeSupports, validateEmail, validateName, validateNewPassword } from "@/lib/auth-shared";

const unauthorized = () => NextResponse.json({ error: "Please log in as a parent." }, { status: 401 });

// The parent's children with a short progress summary each.
export async function GET(request: Request) {
  const parent = await requireParent(request);
  if (!parent) return unauthorized();
  const ids = childIdsOf(parent.user);
  const linked = await Promise.all(ids.map(async (id) => ((await isMyChild(parent.user, id)) ? childSummary(id) : null)));
  return NextResponse.json({ children: linked.filter((c) => c !== null) });
}

// Create a real login for the child (a student account) and link it to this parent.
export async function POST(request: Request) {
  const parent = await requireParent(request);
  if (!parent) return unauthorized();
  if (rateLimited(`child:${parent.user.id}`, 10)) {
    return NextResponse.json({ error: "Too many tries. Please wait a moment." }, { status: 429 });
  }

  const b = await request.json().catch(() => ({}));
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const age = Number(b.age);
  const supports = normalizeSupports(b.supports);
  if (validateName(name) || validateEmail(email) || validateNewPassword(password) || !Number.isInteger(age) || age < 3 || age > 19 || supports.length === 0) {
    return NextResponse.json({ error: "Some details look wrong. Please check them and try again." }, { status: 400 });
  }

  const col = await users();
  if (await col.findOne({ email }, { projection: { _id: 1 } })) {
    return NextResponse.json({ error: "That email already has an ILUMO account." }, { status: 409 });
  }

  const childId = randomUUID();
  const passwordHash = await hashPassword(password);
  try {
    await col.insertOne({
      _id: childId, email, passwordHash, name, role: "student",
      child: { name, age, needs: supports }, settings: { supports },
      childIds: [], parentId: parent.user.id,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof Error && /E11000/.test(err.message)) {
      return NextResponse.json({ error: "That email already has an ILUMO account." }, { status: 409 });
    }
    console.error("[ilumo] child account creation failed:", err);
    return NextResponse.json({ error: "We couldn't create the account right now." }, { status: 503 });
  }

  const ids = [...new Set([...childIdsOf(parent.user), childId])];
  const { matchedCount } = await col.updateOne({ _id: parent.user.id }, { $set: { childIds: ids } });
  if (matchedCount === 0) {
    await col.deleteOne({ _id: childId });
    return NextResponse.json({ error: "We couldn't link the account to yours. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ child: await childSummary(childId) }, { status: 201 });
}
