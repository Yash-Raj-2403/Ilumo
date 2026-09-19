import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/server/auth";
import { validateEmail } from "@/lib/auth-shared";

// Change the signed-in user's email. Done server-side so the login email and the profile stay in sync.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (validateEmail(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (email === user.email?.toLowerCase()) return NextResponse.json({ ok: true });

  const admin = supabaseAdmin();
  const { data: taken } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (taken) return NextResponse.json({ error: "That email already has an ILUMO account." }, { status: 409 });

  const { error } = await admin.auth.admin.updateUserById(user.id, { email, email_confirm: true });
  if (error) {
    console.error("[ilumo] email change failed:", error.message);
    return NextResponse.json({ error: "We couldn't change your email right now." }, { status: 502 });
  }
  const { error: profileError } = await admin.from("profiles").update({ email }).eq("id", user.id);
  if (profileError) {
    await admin.auth.admin.updateUserById(user.id, { email: user.email! }); // roll back
    return NextResponse.json({ error: "We couldn't change your email right now." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
