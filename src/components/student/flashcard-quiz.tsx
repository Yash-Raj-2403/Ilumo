"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { Lesson, QuizFeedback } from "@/lib/lesson-types";
import { evaluateAnswer, type Verdict } from "@/lib/flashcards";
import { FlipCard } from "./flashcards";
import { requestFeedback } from "./quiz";
import { useStudent } from "./student-provider";

/**
 * The test as flashcards: the question is on the front, the student types their answer, ILUMO
 * checks it, and the card flips over to show the right answer.
 */
export function FlashcardQuiz({
  lesson, onDone, onSwitch,
}: {
  lesson: Lesson;
  onDone: (answers: (string | null)[], feedback: QuizFeedback) => void;
  onSwitch: () => void;
}) {
  const { student } = useStudent();
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [empty, setEmpty] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [finishing, setFinishing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const q = lesson.quiz[i];
  const last = i === lesson.quiz.length - 1;
  const flipped = verdict !== null;

  useEffect(() => { if (!flipped) input.current?.focus(); }, [i, flipped]);
  useEffect(() => { if (flipped) nextBtn.current?.focus(); }, [flipped]);

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (!typed.trim()) { setEmpty(true); return; }
    setEmpty(false);
    setVerdict(evaluateAnswer(typed, q));
  }

  async function next() {
    // What we record: the right answer if they got it, otherwise what they matched or typed.
    const recorded = verdict!.correct ? q.correctAnswer : (verdict!.matched ?? typed.trim());
    const all = [...answers, recorded];
    setAnswers(all);
    if (!last) {
      setI(i + 1);
      setTyped("");
      setVerdict(null);
      return;
    }
    setFinishing(true);
    onDone(all, await requestFeedback(lesson, all, student));
  }

  if (finishing) return <div role="status" className="rounded-3xl bg-white p-10 text-center card-border"><p className="text-2xl font-bold text-ink">Preparing your feedback...</p></div>;

  return (
    <section aria-labelledby="fq-h" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="fq-h" className="text-3xl font-bold text-ink">Flashcard test</h2>
          <p className="text-lg text-body" aria-live="polite">Card {i + 1} of {lesson.quiz.length}. Type your answer, then check it.</p>
        </div>
        <button type="button" onClick={onSwitch} className="min-h-11 rounded-full bg-white px-5 font-semibold text-brand-deep card-border hover:bg-brand-soft">Use answer choices instead</button>
      </header>

      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <FlipCard
            key={i}
            front={q.question}
            back={
              <>
                <p className="flex items-center justify-center gap-2 text-2xl font-bold">
                  {verdict?.correct ? <><Check className="size-7" aria-hidden /> You got it!</> : <><X className="size-7" aria-hidden /> Not quite</>}
                </p>
                <p className="text-white/85">The answer is</p>
                <p className="text-3xl font-extrabold">{q.correctAnswer}</p>
                <p className="text-lg text-white/90">{q.explanation}</p>
                {!verdict?.correct && typed.trim() && <p className="text-base text-white/75">You wrote: {typed.trim()}</p>}
              </>
            }
            frontLabel="Question"
            backLabel="Answer"
            flipped={flipped}
            tint="bg-tint-yellow"
            heightClass="min-h-[27rem]"
          >
            <form onSubmit={check} className="mt-2 space-y-3 text-left" noValidate>
              <label htmlFor="fq-answer" className="block text-sm font-semibold text-brand-deep">Your answer</label>
              <input
                id="fq-answer"
                ref={input}
                value={typed}
                onChange={(e) => { setTyped(e.target.value); setEmpty(false); }}
                autoComplete="off"
                aria-invalid={empty}
                className="w-full rounded-2xl border-2 border-brand-deep/20 bg-white px-4 py-3 text-xl text-ink outline-none focus:border-brand"
              />
              <div aria-live="assertive">{empty && <p className="font-semibold text-rose-700">⚠ Please type an answer first.</p>}</div>
              <button type="submit" className="min-h-12 w-full rounded-full bg-brand-deep px-6 text-lg font-semibold text-white">Check my answer</button>
            </form>
          </FlipCard>
        </div>
      </div>

      <div aria-live="polite" className="text-center">
        {flipped && (
          <>
            <p className="sr-only">{verdict?.correct ? "Correct." : "Not quite."} The answer is {q.correctAnswer}. {q.explanation}</p>
            <button ref={nextBtn} type="button" onClick={next} className="min-h-14 rounded-full bg-brand px-10 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]">
              {last ? "See my results" : "Next card"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
