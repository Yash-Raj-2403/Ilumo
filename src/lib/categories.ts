// The six accessibility categories. Each has its own page under /student/support/<slug>
// that uses the same student navigation, with content specific to that need.
// `ready: false` categories show "Coming soon" until their experience is built.

export type CategorySlug = "autism" | "blind-low-vision" | "deaf-hoh" | "speech" | "motor" | "learning";

export type Category = {
  slug: CategorySlug;
  title: string;
  short: string;
  summary: string;
  features: string[];
  ready: boolean;
  /** Tailwind classes for the card and icon badge. */
  card: string;
  badge: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "autism",
    title: "Autism & Neurodivergence",
    short: "Autism",
    summary: "Calm, predictable lessons: one task at a time with a visual schedule.",
    features: ["Visual schedules", "Simple instructions", "One task at a time", "Low-distraction interface", "Repetition and predictable activities"],
    ready: true,
    card: "bg-tint-yellow",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    slug: "blind-low-vision",
    title: "Blind & Low Vision",
    short: "Vision",
    summary: "Voice-controlled reading, image descriptions, OCR and braille printing, with large text and high contrast.",
    features: ["TTS / screen-reader support", "Audio-based questions", "Image descriptions", "Large text", "High contrast", "Keyboard/voice navigation"],
    ready: true,
    card: "bg-tint-blue",
    badge: "bg-blue-100 text-blue-600",
  },
  {
    slug: "deaf-hoh",
    title: "Deaf & Hard of Hearing",
    short: "Hearing",
    summary: "Captions for recordings, live captions, sign-language help, text-only lessons and visual sound alerts.",
    features: ["Captions", "Sign-language videos", "Visual instructions", "Text-based questions", "Visual alerts instead of sounds"],
    ready: true,
    card: "bg-tint-pink",
    badge: "bg-rose-100 text-rose-500",
  },
  {
    slug: "speech",
    title: "Speech & Non-speaking",
    short: "Speech",
    summary: "Speech-to-text, picture communication and tap-to-answer questions.",
    features: ["STT where speech is possible", "TTS", "AAC/picture communication", "Tap-to-answer questions", "Symbol-based communication"],
    ready: false,
    card: "bg-tint-green",
    badge: "bg-emerald-100 text-emerald-600",
  },
  {
    slug: "motor",
    title: "Physical & Motor",
    short: "Motor",
    summary: "Large buttons, no precise dragging and extended response time.",
    features: ["Large buttons", "Minimal precise dragging", "Keyboard/switch accessibility", "Voice control", "Extended response time"],
    ready: false,
    card: "bg-tint-purple",
    badge: "bg-violet-100 text-violet-600",
  },
  {
    slug: "learning",
    title: "Learning Disabilities",
    short: "Learning",
    summary: "Dyslexia-friendly reading, phonics, simplified text and extra practice.",
    features: ["Dyslexia-friendly reading", "Text-to-speech", "Phonics-based learning", "Simplified text", "Extra practice/repetition", "Visual learning"],
    ready: false,
    card: "bg-tint-blue",
    badge: "bg-sky-100 text-sky-600",
  },
];

export const categoryHref = (c: Category) => `/student/support/${c.slug}`;
export const findCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
