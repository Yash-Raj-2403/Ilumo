import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimited, requireParent } from "@/lib/server/auth";
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

  const admin = supabaseAdmin();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "student" },
    app_metadata: { parent_id: parent.user.id }, // only the server can set this
  });
  if (error || !created.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    if (!taken) console.error("[ilumo] child createUser failed:", error?.message);
    return NextResponse.json({ error: taken ? "That email already has an ILUMO account." : "We couldn't create the account right now." }, { status: taken ? 409 : 502 });
  }

  const childId = created.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: childId, email, name, role: "student", child: { name, age, needs: supports }, settings: { supports },
  });
  if (profileError) {
    console.error("[ilumo] child profile insert failed:", profileError.message);
    await admin.auth.admin.deleteUser(childId);
    return NextResponse.json({ error: "The database isn't set up yet. Please try again shortly." }, { status: 503 });
  }

  const ids = [...new Set([...childIdsOf(parent.user), childId])];
  const { error: linkError } = await admin.auth.admin.updateUserById(parent.user.id, {
    app_metadata: { ...parent.user.app_metadata, child_ids: ids },
  });
  if (linkError) {
    await admin.auth.admin.deleteUser(childId); // profile row is removed with it (cascade)
    return NextResponse.json({ error: "We couldn't link the account to yours. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ child: await childSummary(childId) }, { status: 201 });
}
