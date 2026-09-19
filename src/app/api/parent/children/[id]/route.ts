import { NextResponse } from "next/server";
import { requireParent } from "@/lib/server/auth";
import { childLessons, childSummary, isMyChild } from "@/lib/server/children";

// One child's details and every lesson with its progress.
export async function GET(request: Request, ctx: RouteContext<"/api/parent/children/[id]">) {
  const parent = await requireParent(request);
  if (!parent) return NextResponse.json({ error: "Please log in as a parent." }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await isMyChild(parent.user, id))) return NextResponse.json({ error: "Child not found." }, { status: 404 });
  const [child, lessons] = await Promise.all([childSummary(id), childLessons(id)]);
  return NextResponse.json({ child, lessons });
}
