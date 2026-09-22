import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo/client";

// Connectivity check: GET /api/health/mongodb
export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const names = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
    const tables = Object.fromEntries(["users", "lessons", "lessonProgress"].map((t) => [t, names.has(t)]));
    // Collections are created on first write, so a missing one isn't necessarily an error yet.
    return NextResponse.json({ connected: true, collections: tables, ready: true });
  } catch (err) {
    console.error("[ilumo] mongodb health check failed:", err);
    return NextResponse.json({ connected: false, ready: false, hint: "Check MONGODB_URI." }, { status: 503 });
  }
}
