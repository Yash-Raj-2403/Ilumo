import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { lessons } from "@/lib/mongo/collections";

export async function GET(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const { id } = await ctx.params;
  const data = await (await lessons()).findOne({ _id: id, ownerId: user.id });
  if (!data) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  return NextResponse.json({ lesson: { ...data.content, id: data._id, source: data.source, visual: data.visual ?? undefined, createdAt: data.createdAt } });
}
