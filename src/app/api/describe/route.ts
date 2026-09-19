import { NextResponse } from "next/server";
import { describePicture, geminiConfigured, isQuotaError } from "@/lib/server/gemini";
import { rateLimited, requireUser } from "@/lib/server/auth";

export const maxDuration = 60;

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX = 6 * 1024 * 1024;
const fail = (error: string, status: number, code: string) => NextResponse.json({ error, code }, { status });

// Describes one picture in words. Used by the "Describe image" buttons.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return fail("Please log in again.", 401, "unauthorized");
  if (rateLimited(`describe:${user.id}`, 15)) return fail("Let's slow down for a moment. Please try again shortly.", 429, "rate_limited");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Please choose a picture first.", 400, "empty");
  if (file.size > MAX) return fail("That picture is too large. Please use one under 6 MB.", 400, "too_large");
  if (!TYPES.includes(file.type)) return fail("Please use a PNG, JPG or WebP picture.", 400, "unsupported");
  if (process.env.USE_MOCK_DATA === "true" || !geminiConfigured()) return fail("Describing pictures needs the AI service, which isn't available right now.", 503, "ai_unavailable");

  try {
    return NextResponse.json(await describePicture(file.type, Buffer.from(await file.arrayBuffer()).toString("base64")));
  } catch (err) {
    console.error("[ilumo] describe failed:", err instanceof Error ? err.message : err);
    if (isQuotaError(err)) return fail("The AI service is busy right now. Please wait a minute and try again.", 429, "rate_limited");
    return fail("We couldn't describe that picture right now. Please try again.", 502, "ai_unavailable");
  }
}
