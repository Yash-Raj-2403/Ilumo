import { supabaseAdmin } from "@/lib/supabase/admin";

export type ImpactStats = { learners: number; families: number; lessons: number; quizzes: number };

/** Real counts from the database. Returns null if they can't be read, so nothing is ever made up. */
export async function getImpactStats(): Promise<ImpactStats | null> {
  try {
    const admin = supabaseAdmin();
    const count = async (build: () => PromiseLike<{ count: number | null; error: unknown }>) => {
      const { count: n, error } = await build();
      if (error || n === null) throw new Error("count failed");
      return n;
    };
    const [learners, families, lessons, quizzes] = await Promise.all([
      count(() => admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student")),
      count(() => admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "parent")),
      count(() => admin.from("lessons").select("id", { count: "exact", head: true })),
      count(() => admin.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).not("quiz", "is", null)),
    ]);
    return { learners, families, lessons, quizzes };
  } catch {
    return null;
  }
}
