import type { CategorySlug } from "@/lib/categories";

// Mirrors what /api/parent/children returns.
export type ChildSummary = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  supports: CategorySlug[];
  /** Total stars earned in the Game Zone. */
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

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Not started yet";
