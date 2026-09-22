import { lessonProgress, lessons, users } from "@/lib/mongo/collections";

export type ImpactStats = { learners: number; families: number; lessons: number; quizzes: number };

/** Real counts from the database. Returns null if they can't be read, so nothing is ever made up. */
export async function getImpactStats(): Promise<ImpactStats | null> {
  try {
    const [learners, families, lessonCount, quizzes] = await Promise.all([
      (await users()).countDocuments({ role: "student" }),
      (await users()).countDocuments({ role: "parent" }),
      (await lessons()).countDocuments({}),
      (await lessonProgress()).countDocuments({ quiz: { $ne: null } }),
    ]);
    return { learners, families, lessons: lessonCount, quizzes };
  } catch {
    return null;
  }
}
