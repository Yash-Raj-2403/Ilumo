import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Connectivity + schema check: GET /api/health/supabase
export async function GET() {
  const admin = supabaseAdmin();
  const auth = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  const tables = await Promise.all(
    ["profiles", "lessons", "lesson_progress"].map(async (t) => [t, !(await admin.from(t).select("*").limit(1)).error] as const),
  );
  const missing = tables.filter(([, ok]) => !ok).map(([t]) => t);
  return NextResponse.json(
    { connected: !auth.error, tables: Object.fromEntries(tables), ready: !auth.error && missing.length === 0, ...(missing.length && { hint: "Run supabase/schema.sql in the Supabase SQL Editor." }) },
    { status: !auth.error && missing.length === 0 ? 200 : 503 },
  );
}
