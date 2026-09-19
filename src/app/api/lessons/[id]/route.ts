import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request, ctx: RouteContext<"/api/lessons/[id]">) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const { id } = await ctx.params;
  const { data } = await supabaseAdmin()
    .from("lessons")
    .select("id, content, source, visual, created_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  return NextResponse.json({ lesson: { ...data.content, id: data.id, source: data.source, visual: data.visual ?? undefined, createdAt: data.created_at } });
}
