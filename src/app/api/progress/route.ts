import { NextResponse } from "next/server";
import { lessonProgress } from "@/lib/mongo/collections";
import { requireUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const docs = await (await lessonProgress()).find({ ownerId: user.id }).toArray();
  const progress = Object.fromEntries(
    docs.map((r) => [r.lessonId, { sectionsRead: r.sectionsRead ?? [], quiz: r.quiz ?? undefined, updatedAt: r.updatedAt }]),
  );
  return NextResponse.json({ progress });
}
