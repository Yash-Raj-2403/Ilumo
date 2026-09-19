import { NextResponse } from "next/server";
import { geminiConfigured, isQuotaError, ocrMaterial } from "@/lib/server/gemini";
import { requireUser } from "@/lib/server/auth";

export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const fail = (error: string, status: number, code: string) => NextResponse.json({ error, code }, { status });

// Turns a PDF or picture into readable blocks (OCR + image descriptions) for the
// "read to me" tool. Plain text never comes here; the browser splits it itself.
export async function POST(request: Request) {
  if (!(await requireUser(request))) return fail("Please log in again.", 401, "unauthorized");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Please choose a file first.", 400, "empty");
  if (file.size === 0) return fail("That file looks empty. Please choose another one.", 400, "empty");
  if (file.size > MAX_BYTES) return fail("That file is too large. Please use one under 8 MB.", 400, "too_large");
  if (!TYPES.includes(file.type)) return fail("This file type isn't supported yet. Try a PDF or image.", 400, "unsupported");

  if (process.env.USE_MOCK_DATA === "true" || !geminiConfigured()) {
    return fail("Reading pictures and PDFs needs the AI service, which isn't available right now. You can paste the text instead.", 503, "ai_unavailable");
  }
  try {
    const blocks = await ocrMaterial(file.type, Buffer.from(await file.arrayBuffer()).toString("base64"));
    return NextResponse.json({ blocks, title: file.name.replace(/\.[^.]+$/, "") });
  } catch (err) {
    console.error("[ilumo] OCR failed:", err instanceof Error ? err.message : err);
    if (isQuotaError(err)) return fail("The AI service is busy right now. Please wait a minute and try again, or paste the text instead.", 429, "rate_limited");
    return fail("We couldn't read that material right now. Please try again.", 502, "ai_unavailable");
  }
}
