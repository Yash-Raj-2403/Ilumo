import type { LessonContent, QuizFeedback } from "@/lib/lesson-types";

const str = (v: unknown, max = 4000) =>
  typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;

function list<T>(v: unknown, map: (x: unknown) => T | null, min = 0): T[] {
  if (!Array.isArray(v)) throw new Error("expected a list");
  const out = v.map(map).filter((x): x is T => x !== null);
  if (out.length < min) throw new Error("list too short");
  return out;
}

const rec = (x: unknown) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {});

/** Throws if Gemini's JSON doesn't match the lesson schema; trims what's usable. */
export function validateLesson(raw: unknown): LessonContent {
  const o = rec(raw);
  const title = str(o.title, 200);
  const summary = str(o.summary);
  if (!title || !summary) throw new Error("missing title or summary");

  const quiz = list(
    o.quiz,
    (x) => {
      const q = rec(x);
      const question = str(q.question);
      const correctAnswer = str(q.correctAnswer);
      const explanation = str(q.explanation);
      const options = Array.isArray(q.options)
        ? q.options.map((s) => str(s, 300)).filter((s): s is string => !!s)
        : [];
      if (!question || !correctAnswer || !explanation || options.length < 2) return null;
      if (!options.includes(correctAnswer)) return null;
      return { question, options, correctAnswer, explanation };
    },
    1,
  );

  return {
    title,
    summary,
    sections: list(o.sections, (x) => {
      const s = rec(x);
      const heading = str(s.heading, 200);
      const content = str(s.content);
      return heading && content ? { heading, content } : null;
    }, 1),
    keyPoints: list(o.keyPoints, (x) => str(x, 400), 1),
    visualDescriptions: list(o.visualDescriptions ?? [], (x) => {
      const v = rec(x);
      const t = str(v.title, 200);
      const d = str(v.description);
      return t && d ? { title: t, description: d } : null;
    }),
    importantTerms: list(o.importantTerms ?? [], (x) => {
      const t = rec(x);
      const term = str(t.term, 200);
      const meaning = str(t.meaning, 600);
      return term && meaning ? { term, meaning } : null;
    }),
    quiz,
  };
}

export function validateFeedback(raw: unknown, score: number, total: number): QuizFeedback {
  const o = rec(raw);
  const feedback = str(o.feedback);
  if (!feedback) throw new Error("missing feedback");
  const strs = (v: unknown) => (Array.isArray(v) ? list(v, (x) => str(x, 300)) : []);
  // Score is computed by us, never trusted from the model.
  return { score, total, strengths: strs(o.strengths), needsPractice: strs(o.needsPractice), feedback };
}
