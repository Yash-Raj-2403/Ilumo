import type { LessonContent, QuizFeedback } from "@/lib/lesson-types";
import mockLesson from "@/data/mockPhotosynthesisLesson.json";

export const MOCK_LESSON: LessonContent = mockLesson;

/** Used when Gemini is unavailable. Computed from the real answers, not canned. */
export function mockFeedback(lesson: LessonContent, answers: (string | null)[]): QuizFeedback {
  const total = lesson.quiz.length;
  const right = lesson.quiz.filter((q, i) => answers[i] === q.correctAnswer);
  const wrong = lesson.quiz.filter((q, i) => answers[i] !== q.correctAnswer);
  const score = right.length;
  const feedback =
    wrong.length === 0
      ? `Great work! You got every question right and understood the main ideas of ${lesson.title}.`
      : score >= total / 2
        ? `Good job. You understood much of ${lesson.title}. Take another look at the ideas below and try again when you're ready.`
        : `Nice effort. ${lesson.title} has a few ideas worth revisiting. Reading the lesson once more will help.`;
  return {
    score,
    total,
    strengths: right.map((q) => q.question),
    needsPractice: wrong.map((q) => q.question),
    feedback,
  };
}
