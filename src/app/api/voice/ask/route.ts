import { NextResponse } from "next/server";
import { askTutor, geminiConfigured, isQuotaError } from "@/lib/server/gemini";
import { rateLimited, requireUser } from "@/lib/server/auth";

export const maxDuration = 60;

// Answers a spoken question or "explain that again" about the material being read aloud.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  if (rateLimited(`ask:${user.id}`, 20)) {
    return NextResponse.json({ error: "Let's slow down for a moment." }, { status: 429 });
  }
  const b = await request.json().catch(() => ({}));
  const question = typeof b.question === "string" ? b.question.trim() : "";
  const mode = b.mode === "explain" || b.mode === "summary" ? b.mode : "question";
  if (!question || typeof b.material !== "string") {
    return NextResponse.json({ error: "Nothing to answer." }, { status: 400 });
  }
  if (process.env.USE_MOCK_DATA === "true" || !geminiConfigured()) {
    return NextResponse.json({ error: "The AI tutor isn't available right now.", code: "ai_unavailable" }, { status: 503 });
  }
  const history = Array.isArray(b.history)
    ? b.history.slice(-3).map((h: { q?: unknown; a?: unknown }) => ({ q: String(h.q ?? "").slice(0, 300), a: String(h.a ?? "").slice(0, 600) }))
    : [];
  try {
    const answer = await askTutor({
      question,
      mode,
      title: typeof b.title === "string" ? b.title.slice(0, 200) : "",
      material: b.material,
      current: typeof b.current === "string" ? b.current : "",
      history,
    });
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[ilumo] tutor failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: isQuotaError(err) ? "The AI tutor is busy right now." : "I couldn't work that out.", code: "ai_unavailable" },
      { status: isQuotaError(err) ? 429 : 502 },
    );
  }
}
