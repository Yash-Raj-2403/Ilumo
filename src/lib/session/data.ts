// Browser-side data access. Every call goes through an authenticated API route — unlike
// Supabase, MongoDB has no row-level security, so the server (not the client) enforces that
// a user can only ever touch their own data.
import type { Lesson, QuizFeedback } from "@/lib/lesson-types";
import type { Child, Role } from "@/lib/auth-shared";
import { authedFetch } from "./authed-fetch";

export type Profile = { id: string; email: string; name: string; role: Role; child: Child | null; settings: unknown };
export type ProgressRow = { sectionsRead: number[]; quiz?: { answers: (string | null)[]; feedback: QuizFeedback }; updatedAt: string };

async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data as T;
}

const patchProfile = async (body: Record<string, unknown>) =>
  unwrap(await authedFetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));

// `userId` is kept in every signature for compatibility with existing call sites; identity is
// actually derived server-side from the bearer token, so it's unused here.

export async function loadProfile(_userId: string): Promise<Profile | null> {
  void _userId;
  const res = await authedFetch("/api/profile");
  if (res.status === 401) return null;
  const { profile } = await unwrap<{ profile: Profile }>(res);
  return profile;
}

export async function updateChild(_userId: string, child: Child) {
  await patchProfile({ child });
}

export async function updateName(_userId: string, name: string) {
  await patchProfile({ name });
}

export async function saveSettings(_userId: string, settings: unknown) {
  await patchProfile({ settings });
}

export async function loadLessons(_userId: string): Promise<Lesson[]> {
  void _userId;
  const { lessons } = await unwrap<{ lessons: Lesson[] }>(await authedFetch("/api/lessons"));
  return lessons;
}

export async function insertLesson(_userId: string, lesson: Lesson) {
  await unwrap(
    await authedFetch("/api/lessons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesson }) }),
  );
}

export async function loadProgress(_userId: string): Promise<Record<string, ProgressRow>> {
  void _userId;
  const { progress } = await unwrap<{ progress: Record<string, ProgressRow> }>(await authedFetch("/api/progress"));
  return progress;
}

export async function upsertProgress(_userId: string, lessonId: string, p: ProgressRow) {
  await unwrap(
    await authedFetch(`/api/progress/${encodeURIComponent(lessonId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }),
  );
}
