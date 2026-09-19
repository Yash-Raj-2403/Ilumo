import type { LessonContent, QuizQuestion } from "@/lib/lesson-types";

export type Flashcard = { front: string; back: string; label: string };

const firstSentences = (text: string, n: number) =>
  (text.match(/[^.!?]+[.!?]+/g) ?? [text]).slice(0, n).join(" ").trim();

/** Three study cards built from the lesson itself: key words first, then sections, then main ideas. */
export function buildFlashcards(lesson: LessonContent, count = 3): Flashcard[] {
  const cards: Flashcard[] = [];
  for (const t of lesson.importantTerms) cards.push({ label: "Word", front: t.term, back: t.meaning });
  for (const s of lesson.sections) cards.push({ label: "Topic", front: s.heading, back: firstSentences(s.content, 2) });
  lesson.keyPoints.forEach((k, i) => cards.push({ label: "Main idea", front: `Main idea ${i + 1}`, back: k }));
  // No repeats, and prefer a mix of kinds when the lesson has plenty.
  const seen = new Set<string>();
  const unique = cards.filter((c) => (seen.has(c.front) ? false : seen.add(c.front)));
  const pick: Flashcard[] = [];
  for (const kind of ["Word", "Topic", "Topic", "Main idea"]) {
    const c = unique.find((x) => x.label === kind && !pick.includes(x));
    if (c && pick.length < count) pick.push(c);
  }
  for (const c of unique) if (pick.length < count && !pick.includes(c)) pick.push(c);
  return pick.slice(0, count);
}

// ---- checking a typed answer -----------------------------------------------------------------
const STOP = new Set("a an the of to in on at is are was were be and or it its this that with for as by from".split(" "));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const keywords = (s: string) => norm(s).split(" ").filter((w) => w && !STOP.has(w));

const bigrams = (s: string) => {
  const t = norm(s).replace(/ /g, "");
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
};
/** 0 to 1: how alike two short texts are (spelling slips still score high). */
function similarity(a: string, b: string): number {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const A = bigrams(x);
  const B = bigrams(y);
  if (A.length === 0 || B.length === 0) return 0;
  const counts = new Map<string, number>();
  A.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
  let hit = 0;
  B.forEach((g) => {
    const n = counts.get(g) ?? 0;
    if (n > 0) { hit++; counts.set(g, n - 1); }
  });
  return (2 * hit) / (A.length + B.length);
}

/** How well a typed answer matches one option: whole-answer similarity, or all its key words present. */
function score(typed: string, option: string): number {
  const kw = keywords(option);
  const typedWords = new Set(keywords(typed));
  const covered = kw.length ? kw.filter((w) => typedWords.has(w) || [...typedWords].some((t) => similarity(t, w) >= 0.8)).length / kw.length : 0;
  return Math.max(similarity(typed, option), kw.length ? covered * 0.95 : 0);
}

export type Verdict = { correct: boolean; matched: string | null };

/**
 * Judge a typed answer against a question's options. It counts if it clearly matches the right
 * option (or is that option's letter) and matches no other option better.
 */
export function evaluateAnswer(typed: string, q: QuizQuestion): Verdict {
  const t = typed.trim();
  if (!t) return { correct: false, matched: null };
  const letter = /^\(?([a-f])\)?[.)]?$/i.exec(t);
  if (letter) {
    const opt = q.options["abcdef".indexOf(letter[1].toLowerCase())];
    if (opt) return { correct: opt === q.correctAnswer, matched: opt };
  }
  let best: string | null = null;
  let bestScore = 0;
  for (const o of q.options) {
    const sc = score(t, o);
    if (sc > bestScore) { best = o; bestScore = sc; }
  }
  if (bestScore >= 0.6) return { correct: best === q.correctAnswer, matched: best };

  // A short answer such as "roots" for "Through the roots": count it if it uses a word that only
  // one option has, and no word that belongs to a different option.
  const optWords = q.options.map(keywords);
  const typedWords = keywords(t);
  const hits = optWords.map((words, i) => {
    const only = words.filter((w) => !optWords.some((other, j) => j !== i && other.includes(w)));
    return typedWords.filter((w) => only.some((o) => o === w || similarity(o, w) >= 0.85)).length;
  });
  const winners = hits.map((n, i) => (n > 0 ? i : -1)).filter((i) => i >= 0);
  if (winners.length === 1) {
    const matched = q.options[winners[0]];
    return { correct: matched === q.correctAnswer, matched };
  }
  return { correct: false, matched: null };
}
