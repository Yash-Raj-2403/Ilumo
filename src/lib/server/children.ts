import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeSupports } from "@/lib/auth-shared";
import type { CategorySlug } from "@/lib/categories";

// A parent is linked to a child account by two values that only the server can write
// (auth app_metadata): the parent's `child_ids` and the child's `parent_id`. Both must agree.
// All reads of a child's data go through here so the check can't be skipped.

export type ChildSummary = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  supports: CategorySlug[];
  lessonCount: number;
  completedCount: number;
  avgProgress: number;
  avgQuizPercent: number | null;
  lastActive: string | null;
};

export type ChildLesson = {
  id: string;
  title: string;
  summary: string;
  source: string;
  createdAt: string;
  keyPoints: string[];
  sectionsTotal: number;
  sectionsRead: number;
  progress: number;
  updatedAt: string | null;
  quiz: { score: number; total: number; feedback: string; strengths: string[]; needsPractice: string[] } | null;
};

export const childIdsOf = (user: { app_metadata?: Record<string, unknown> }) => {
  const ids = user.app_metadata?.child_ids;
  return Array.isArray(ids) ? (ids.filter((i) => typeof i === "string") as string[]) : [];
};

/** Is `childId` really this parent's child? */
export async function isMyChild(parent: { id: string; app_metadata?: Record<string, unknown> }, childId: string) {
  if (!childIdsOf(parent).includes(childId)) return false;
  const { data } = await supabaseAdmin().auth.admin.getUserById(childId);
  return data.user?.app_metadata?.parent_id === parent.id;
}

type Content = { summary?: string; sections?: unknown[]; keyPoints?: string[] };
type ProgressRow = { lesson_id: string; sections_read: number[] | null; quiz: { feedback?: { score: number; total: number; feedback: string; strengths?: string[]; needsPractice?: string[] } } | null; updated_at: string };

export async function childLessons(childId: string): Promise<ChildLesson[]> {
  const admin = supabaseAdmin();
  const [{ data: lessons }, { data: progress }] = await Promise.all([
    admin.from("lessons").select("id, title, source, content, created_at").eq("owner_id", childId).order("created_at", { ascending: false }),
    admin.from("lesson_progress").select("lesson_id, sections_read, quiz, updated_at").eq("owner_id", childId),
  ]);
  const byLesson = new Map((progress as ProgressRow[] | null ?? []).map((p) => [p.lesson_id, p]));
  return (lessons ?? []).map((l) => {
    const c = l.content as Content;
    const total = c.sections?.length ?? 0;
    const p = byLesson.get(l.id);
    const read = Math.min(p?.sections_read?.length ?? 0, total);
    const q = p?.quiz?.feedback;
    return {
      id: l.id,
      title: l.title,
      summary: c.summary ?? "",
      source: l.source,
      createdAt: l.created_at,
      keyPoints: (c.keyPoints ?? []).slice(0, 3),
      sectionsTotal: total,
      sectionsRead: read,
      progress: Math.round(((read + (q ? 1 : 0)) / (total + 1)) * 100),
      updatedAt: p?.updated_at ?? null,
      quiz: q ? { score: q.score, total: q.total, feedback: q.feedback, strengths: q.strengths ?? [], needsPractice: q.needsPractice ?? [] } : null,
    };
  });
}

export async function childSummary(childId: string): Promise<ChildSummary | null> {
  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("id, name, email, child, settings").eq("id", childId).maybeSingle();
  if (!profile) return null;
  const lessons = await childLessons(childId);
  const quizzes = lessons.filter((l) => l.quiz && l.quiz.total > 0);
  const child = profile.child as { age?: number; needs?: unknown } | null;
  const settings = profile.settings as { supports?: unknown } | null;
  const supports = normalizeSupports(settings?.supports).length ? normalizeSupports(settings?.supports) : normalizeSupports(child?.needs);
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    age: child?.age ?? null,
    supports,
    lessonCount: lessons.length,
    completedCount: lessons.filter((l) => l.progress === 100).length,
    avgProgress: lessons.length ? Math.round(lessons.reduce((n, l) => n + l.progress, 0) / lessons.length) : 0,
    avgQuizPercent: quizzes.length ? Math.round((quizzes.reduce((n, l) => n + l.quiz!.score / l.quiz!.total, 0) / quizzes.length) * 100) : null,
    lastActive: lessons.map((l) => l.updatedAt ?? l.createdAt).sort().pop() ?? null,
  };
}
