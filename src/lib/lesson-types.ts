// Shared lesson shapes. Mock and real (Gemini) responses both use these.
import type { CategorySlug } from "./categories";

export type LessonSection = { heading: string; content: string };
export type VisualDescription = { title: string; description: string };
export type ImportantTerm = { term: string; meaning: string };
export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type LessonContent = {
  title: string;
  summary: string;
  sections: LessonSection[];
  keyPoints: string[];
  visualDescriptions: VisualDescription[];
  importantTerms: ImportantTerm[];
  quiz: QuizQuestion[];
};

export type Lesson = LessonContent & {
  id: string;
  createdAt: string;
  /** Where the lesson came from: real Gemini output or the bundled sample. */
  source: "gemini" | "mock";
  /** Which kinds of support this lesson was adapted for (empty or missing = all of them). */
  supports?: CategorySlug[];
  /** "sample" shows the built-in diagram; "image" shows the uploaded picture. */
  visual?: { kind: "sample" } | { kind: "image"; dataUrl: string; alt: string };
};

export type QuizFeedback = {
  score: number;
  total: number;
  strengths: string[];
  needsPractice: string[];
  feedback: string;
};

export type StudentProfile = {
  id: string;
  name: string;
  age: number;
  role: "student";
  accessibilityProfile: {
    visualSupport: boolean;
    largeText: boolean;
    highContrast: boolean;
    imageDescriptions: boolean;
    readAloud: boolean;
    keyboardNavigation: boolean;
  };
  learningPreferences: {
    contentStyle: "simple" | "detailed";
    chunkedContent: boolean;
    focusMode: boolean;
  };
};

export const DEMO_STUDENT: StudentProfile = {
  id: "student_001",
  name: "Aarav",
  age: 14,
  role: "student",
  accessibilityProfile: {
    visualSupport: true,
    largeText: true,
    highContrast: false,
    imageDescriptions: true,
    readAloud: true,
    keyboardNavigation: true,
  },
  learningPreferences: { contentStyle: "simple", chunkedContent: true, focusMode: false },
};
