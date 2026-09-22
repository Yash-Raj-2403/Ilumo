import { NextResponse } from "next/server";
import { lessonProgress } from "@/lib/mongo/collections";
import { requireUser } from "@/lib/server/auth";
import type { QuizFeedback } from "@/lib/lesson-types";

type Body = { sectionsRead?: unknown; quiz?: { answers: (string | null)[]; feedback: QuizFeedback } | null; updatedAt?: unknown };

export async function PUT(request: Request, ctx: RouteContext<"/api/progress/[lessonId]">) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const { lessonId } = await ctx.params;
  const b: Body = await request.json().catch(() => ({}));
  const sectionsRead = Array.isArray(b.sectionsRead) ? b.sectionsRead.filter((n): n is number => typeof n === "number") : [];
  const updatedAt = typeof b.updatedAt === "string" && b.updatedAt ? b.updatedAt : new Date().toISOString();

  await (await lessonProgress()).updateOne(
    { _id: `${user.id}:${lessonId}` },
    { $set: { _id: `${user.id}:${lessonId}`, ownerId: user.id, lessonId, sectionsRead, quiz: b.quiz ?? null, updatedAt } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true });
}
