import type { Collection } from "mongodb";
import type { Child, Role } from "@/lib/auth-shared";
import type { Lesson, QuizFeedback } from "@/lib/lesson-types";
import { ensureIndexes, getDb } from "./client";

// Documents use the same string ids the app already generates (crypto.randomUUID()) as `_id`,
// so the shape closely matches what used to live in Postgres.

export type UserDoc = {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  child: Child | null;
  settings: unknown;
  /** Parent only: ids of linked student accounts. */
  childIds: string[];
  /** Student only, set when created by a parent: the parent's id. */
  parentId: string | null;
  createdAt: string;
};

export type LessonDoc = {
  _id: string;
  ownerId: string;
  title: string;
  content: Omit<Lesson, "id" | "createdAt" | "source" | "visual">;
  source: "gemini" | "mock";
  visual: Lesson["visual"] | null;
  createdAt: string;
};

export type ProgressDoc = {
  _id: string; // `${ownerId}:${lessonId}`
  ownerId: string;
  lessonId: string;
  sectionsRead: number[];
  quiz: { answers: (string | null)[]; feedback: QuizFeedback } | null;
  updatedAt: string;
};

export type ContactMessageDoc = {
  _id: string;
  name: string;
  email: string;
  message: string;
  receivedAt: string;
};

async function collection<T extends { _id: string }>(name: string): Promise<Collection<T>> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<T>(name);
}

export const users = () => collection<UserDoc>("users");
export const lessons = () => collection<LessonDoc>("lessons");
export const lessonProgress = () => collection<ProgressDoc>("lessonProgress");
export const contactMessages = () => collection<ContactMessageDoc>("contactMessages");
