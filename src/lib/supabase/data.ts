// Browser-side data access. Row Level Security limits every query to the signed-in user.
import type { Lesson, QuizFeedback } from "@/lib/lesson-types";
import type { Child, Role } from "@/lib/auth-shared";
import { supabase } from "./client";

export type Profile = { id: string; email: string; name: string; role: Role; child: Child | null; settings: unknown };
export type ProgressRow = { sectionsRead: number[]; quiz?: { answers: (string | null)[]; feedback: QuizFeedback }; updatedAt: string };

const MAX_IMAGE_CHARS = 1_500_000; // keep rows small: bigger pictures aren't saved with the lesson

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, child, settings")
    .eq("id", userId)
    .maybeSingle();
  fail(error);
  return data as Profile | null;
}

export async function updateChild(userId: string, child: Child) {
  fail((await supabase.from("profiles").update({ child }).eq("id", userId)).error);
}

export async function updateName(userId: string, name: string) {
  fail((await supabase.from("profiles").update({ name }).eq("id", userId)).error);
}

export async function saveSettings(userId: string, settings: unknown) {
  fail((await supabase.from("profiles").update({ settings }).eq("id", userId)).error);
}

export async function loadLessons(userId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, content, source, visual, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map((r) => ({
    ...r.content,
    id: r.id,
    source: r.source,
    visual: r.visual ?? undefined,
    createdAt: r.created_at,
  }));
}

export async function insertLesson(userId: string, lesson: Lesson) {
  const { id, createdAt, source, visual, ...content } = lesson;
  const keepVisual = visual?.kind === "image" && visual.dataUrl.length > MAX_IMAGE_CHARS ? null : (visual ?? null);
  fail(
    (
      await supabase
        .from("lessons")
        .upsert({ id, owner_id: userId, title: lesson.title, content, source, visual: keepVisual, created_at: createdAt })
    ).error,
  );
}

export async function loadProgress(userId: string): Promise<Record<string, ProgressRow>> {
  const { data, error } = await supabase.from("lesson_progress").select("lesson_id, sections_read, quiz, updated_at").eq("owner_id", userId);
  fail(error);
  return Object.fromEntries(
    (data ?? []).map((r) => [r.lesson_id, { sectionsRead: r.sections_read ?? [], quiz: r.quiz ?? undefined, updatedAt: r.updated_at }]),
  );
}

export async function upsertProgress(userId: string, lessonId: string, p: ProgressRow) {
  fail(
    (
      await supabase.from("lesson_progress").upsert({
        owner_id: userId,
        lesson_id: lessonId,
        sections_read: p.sectionsRead,
        quiz: p.quiz ?? null,
        updated_at: p.updatedAt,
      })
    ).error,
  );
}
