import { lessonProgress, lessons, users } from "@/lib/mongo/collections";
import { normalizeSupports } from "@/lib/auth-shared";
import type { CategorySlug } from "@/lib/categories";
import type { AuthedUser } from "./auth";

// A parent is linked to a child account by two values that only the server can write: the
// parent's `childIds` and the child's `parentId`. Both must agree. All reads of a child's
// data go through here so the check can't be skipped.

export type ChildSummary = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  supports: CategorySlug[];
  gameStars: number;
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

export const childIdsOf = (user: Pick<AuthedUser, "childIds">) => user.childIds;

/** Is `childId` really this parent's child? */
export async function isMyChild(parent: Pick<AuthedUser, "id" | "childIds">, childId: string) {
  if (!childIdsOf(parent).includes(childId)) return false;
  const child = await (await users()).findOne({ _id: childId }, { projection: { parentId: 1 } });
  return child?.parentId === parent.id;
}

type Content = { summary?: string; sections?: unknown[]; keyPoints?: string[] };

export async function childLessons(childId: string): Promise<ChildLesson[]> {
  const [lessonDocs, progressDocs] = await Promise.all([
    (await lessons()).find({ ownerId: childId }).sort({ createdAt: -1 }).toArray(),
    (await lessonProgress()).find({ ownerId: childId }).toArray(),
  ]);
  const byLesson = new Map(progressDocs.map((p) => [p.lessonId, p]));
  return lessonDocs.map((l) => {
    const c = l.content as Content;
    const total = c.sections?.length ?? 0;
    const p = byLesson.get(l._id);
    const read = Math.min(p?.sectionsRead?.length ?? 0, total);
    const q = p?.quiz?.feedback;
    return {
      id: l._id,
      title: l.title,
      summary: c.summary ?? "",
      source: l.source,
      createdAt: l.createdAt,
      keyPoints: (c.keyPoints ?? []).slice(0, 3),
      sectionsTotal: total,
      sectionsRead: read,
      progress: Math.round(((read + (q ? 1 : 0)) / (total + 1)) * 100),
      updatedAt: p?.updatedAt ?? null,
      quiz: q ? { score: q.score, total: q.total, feedback: q.feedback, strengths: q.strengths ?? [], needsPractice: q.needsPractice ?? [] } : null,
    };
  });
}

export async function childSummary(childId: string): Promise<ChildSummary | null> {
  const profile = await (await users()).findOne({ _id: childId }, { projection: { _id: 1, name: 1, email: 1, child: 1, settings: 1 } });
  if (!profile) return null;
  const lessonList = await childLessons(childId);
  const quizzes = lessonList.filter((l) => l.quiz && l.quiz.total > 0);
  const child = profile.child as { age?: number; needs?: unknown } | null;
  const settings = profile.settings as { supports?: unknown; gameStars?: Record<string, unknown> } | null;
  const gameStars = Object.values(settings?.gameStars ?? {}).reduce<number>((n, v) => n + (typeof v === "number" ? Math.min(3, Math.max(0, v)) : 0), 0);
  const supports = normalizeSupports(settings?.supports).length ? normalizeSupports(settings?.supports) : normalizeSupports(child?.needs);
  return {
    id: profile._id,
    name: profile.name,
    email: profile.email,
    age: child?.age ?? null,
    supports,
    gameStars,
    lessonCount: lessonList.length,
    completedCount: lessonList.filter((l) => l.progress === 100).length,
    avgProgress: lessonList.length ? Math.round(lessonList.reduce((n, l) => n + l.progress, 0) / lessonList.length) : 0,
    avgQuizPercent: quizzes.length ? Math.round((quizzes.reduce((n, l) => n + l.quiz!.score / l.quiz!.total, 0) / quizzes.length) * 100) : null,
    lastActive: lessonList.map((l) => l.updatedAt ?? l.createdAt).sort().pop() ?? null,
  };
}
