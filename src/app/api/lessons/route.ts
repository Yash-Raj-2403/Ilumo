import { NextResponse } from "next/server";
import { lessons } from "@/lib/mongo/collections";
import { requireUser } from "@/lib/server/auth";
import type { Lesson } from "@/lib/lesson-types";

const MAX_IMAGE_CHARS = 1_500_000; // keep documents small: bigger pictures aren't saved with the lesson

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const docs = await (await lessons()).find({ ownerId: user.id }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({
    lessons: docs.map((r) => ({ ...r.content, id: r._id, source: r.source, visual: r.visual ?? undefined, createdAt: r.createdAt })),
  });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const lesson = body.lesson as Lesson | undefined;
  if (!lesson || typeof lesson.id !== "string" || !lesson.id || typeof lesson.title !== "string" || !lesson.title) {
    return NextResponse.json({ error: "That lesson doesn't look right." }, { status: 400 });
  }
  const { id, createdAt, source, visual, ...content } = lesson;
  const keepVisual = visual?.kind === "image" && visual.dataUrl.length > MAX_IMAGE_CHARS ? null : (visual ?? null);
  const safeSource = source === "gemini" || source === "mock" ? source : "mock";
  const safeCreatedAt = typeof createdAt === "string" && createdAt ? createdAt : new Date().toISOString();
  await (await lessons()).updateOne(
    { _id: id },
    { $set: { _id: id, ownerId: user.id, title: lesson.title, content, source: safeSource, visual: keepVisual, createdAt: safeCreatedAt } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true });
}
