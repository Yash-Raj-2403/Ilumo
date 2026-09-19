import { NextResponse } from "next/server";
import { captionMedia, geminiConfigured, isQuotaError } from "@/lib/server/gemini";
import { rateLimited, requireUser } from "@/lib/server/auth";
import { sanitizeSegments } from "@/lib/captions";

export const maxDuration = 120;

const MAX_BYTES = 15 * 1024 * 1024; // the AI accepts about 20 MB in one request
const TYPES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/webm", "audio/flac",
  "video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/x-m4v",
];

const fail = (error: string, status: number, code: string) => NextResponse.json({ error, code }, { status });

// Turns a recording into captions (speech plus described sounds), a summary and key points.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return fail("Please log in again.", 401, "unauthorized");
  if (rateLimited(`captions:${user.id}`, 6, 10 * 60_000)) return fail("Please wait a little before captioning another recording.", 429, "rate_limited");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Please choose an audio or video file.", 400, "empty");
  if (file.size === 0) return fail("That file looks empty. Please choose another one.", 400, "empty");
  if (file.size > MAX_BYTES) return fail("That recording is too big. Please use one under 15 MB, or a shorter clip.", 400, "too_large");
  const type = (file.type || "").split(";")[0];
  if (!TYPES.includes(type)) return fail("This file type isn't supported. Try an MP3, WAV, M4A, MP4 or WebM file.", 400, "unsupported");

  if (process.env.USE_MOCK_DATA === "true" || !geminiConfigured()) {
    return fail("Captioning needs the AI service, which isn't available right now.", 503, "ai_unavailable");
  }
  try {
    const out = await captionMedia(type, Buffer.from(await file.arrayBuffer()).toString("base64"));
    const segments = sanitizeSegments(out.segments);
    if (segments.length === 0) return fail("We couldn't find any speech or sounds to caption in that recording.", 422, "no_speech");
    return NextResponse.json({ title: file.name.replace(/\.[^.]+$/, ""), segments, summary: out.summary, keyPoints: out.keyPoints });
  } catch (err) {
    console.error("[ilumo] captioning failed:", err instanceof Error ? err.message : err);
    if (isQuotaError(err)) return fail("The AI service is busy right now. Please wait a minute and try again.", 429, "rate_limited");
    return fail("We couldn't caption that recording right now. Please try again.", 502, "ai_unavailable");
  }
}
