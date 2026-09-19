import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { clientIp, rateLimited } from "@/lib/server/auth";
import { normalizeSupports, validateEmail, validateName, validateNewPassword } from "@/lib/auth-shared";

// Creates the account server-side so the profile row and the login are created together.
// The email is marked confirmed so the demo doesn't depend on email delivery.
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

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    if (!taken) console.error("[ilumo] createUser failed:", error?.message);
    return NextResponse.json(
      { error: taken ? "That email already has an ILUMO account." : "We couldn't create your account right now." },
      { status: taken ? 409 : 502 },
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: data.user.id, email, name, role, child: null, settings: { supports } });
  if (profileError) {
    console.error("[ilumo] profile insert failed:", profileError.message);
    await admin.auth.admin.deleteUser(data.user.id); // don't leave a half-made account behind
    return NextResponse.json(
      { error: "The database isn't set up yet. Please try again shortly.", code: "db_unavailable" },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true });
}
