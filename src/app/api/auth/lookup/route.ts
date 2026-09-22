import { NextResponse } from "next/server";
import { users } from "@/lib/mongo/collections";
import { clientIp, rateLimited } from "@/lib/server/auth";
import { validateEmail } from "@/lib/auth-shared";

// Powers the "Welcome back, <name>" step of the login flow.
// Returns only whether the email has an account and a first name.
export async function POST(request: Request) {
  if (rateLimited(`lookup:${clientIp(request)}`)) {
    return NextResponse.json({ error: "Too many tries. Please wait a moment." }, { status: 429 });
  }
  const { email } = await request.json().catch(() => ({}));
  if (typeof email !== "string" || validateEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  try {
    const data = await (await users()).findOne({ email: email.trim().toLowerCase() }, { projection: { name: 1 } });
    return NextResponse.json({ exists: !!data, name: data?.name?.split(" ")[0] ?? null });
  } catch (err) {
    console.error("[ilumo] lookup failed:", err);
    return NextResponse.json({ error: "The database isn't set up yet.", code: "db_unavailable" }, { status: 503 });
  }
}
