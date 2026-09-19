import { NextResponse } from "next/server";
import { geminiConfigured, quizFeedback } from "@/lib/server/gemini";
import { mockFeedback } from "@/lib/server/mock";
import { requireUser } from "@/lib/server/auth";
import { validateLesson } from "@/lib/server/validate";
import { DEMO_STUDENT, type StudentProfile } from "@/lib/lesson-types";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await requireUser(request))) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  let lesson, answers: (string | null)[], profile: StudentProfile;
  try {
    const body = await request.json();
    lesson = validateLesson(body.lesson);
    answers = Array.isArray(body.answers) ? body.answers.map((a: unknown) => (typeof a === "string" ? a : null)) : [];
    profile = body.profile ?? DEMO_STUDENT;
  } catch {
    return NextResponse.json({ error: "We couldn't read your quiz answers." }, { status: 400 });
  }

  if (process.env.USE_MOCK_DATA === "true" || !geminiConfigured()) {
    return NextResponse.json({ feedback: mockFeedback(lesson, answers), source: "mock" });
  }
  try {
    return NextResponse.json({ feedback: await quizFeedback(lesson, answers, profile), source: "gemini" });
  } catch (err) {
    console.error("[ilumo] quiz feedback failed:", err instanceof Error ? err.message : err);
    // Feedback is a nice-to-have: fall back to locally computed results rather than erroring.
    return NextResponse.json({ feedback: mockFeedback(lesson, answers), source: "mock" });
  }
}
