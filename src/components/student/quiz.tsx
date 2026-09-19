"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Volume2, X } from "lucide-react";
import type { Lesson, QuizFeedback } from "@/lib/lesson-types";
import { authedFetch } from "@/lib/supabase/authed-fetch";
import { mockFeedback } from "@/lib/server/mock";
import { useStudent } from "./student-provider";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function Quiz({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: (answers: (string | null)[], feedback: QuizFeedback) => void;
}) {
  const { student, speakOne, speech } = useStudent();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [finishing, setFinishing] = useState(false);
  const headingRef = useRef<HTMLLegendElement>(null);

  const q = lesson.quiz[index];
  const last = index === lesson.quiz.length - 1;
  const correct = checked && selected === q.correctAnswer;

  useEffect(() => headingRef.current?.focus(), [index]);

  const hearQuestion = () => speakOne("quiz-q", q.question);
  const hearOptions = () =>
    speakOne("quiz-o", q.options.map((o, i) => `${LETTERS[i]}. ${o}.`).join(" "));

  async function next() {
    const all = [...answers, selected];
    if (!last) {
      setAnswers(all);
      setIndex(index + 1);
      setSelected(null);
      setChecked(false);
      return;
    }
    setAnswers(all);
    setFinishing(true);
    let feedback: QuizFeedback;
    try {
      const res = await authedFetch(`/api/lessons/${lesson.id}/quiz-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson, answers: all, profile: student }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await res.json();
      if (!res.ok || !data.feedback) throw new Error();
      feedback = data.feedback;
    } catch {
      feedback = mockFeedback(lesson, all); // never block the student on the network
    }
    onDone(all, feedback);
  }

  if (finishing) {
    return (
      <div role="status" className="rounded-3xl bg-white p-10 text-center card-border">
        <p className="text-2xl font-bold text-ink">Preparing your feedback...</p>
      </div>
    );
  }

  const listen = "inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 font-semibold text-brand-deep card-border hover:bg-brand-soft";

  return (
    <section aria-labelledby="quiz-title" className="space-y-6">
      <header>
        <h2 id="quiz-title" className="text-3xl font-bold text-ink">Let&apos;s check what you learned.</h2>
        <p className="mt-1 text-lg text-body" aria-live="polite">Question {index + 1} of {lesson.quiz.length}</p>
      </header>

      <fieldset className="space-y-4">
        <legend ref={headingRef} tabIndex={-1} className="mb-4 text-2xl font-bold leading-snug text-ink outline-none">
          {q.question}
        </legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={hearQuestion} className={listen}>
            <Volume2 className="size-4" aria-hidden /> Hear Question
          </button>
          <button type="button" onClick={hearOptions} className={listen}>
            <Volume2 className="size-4" aria-hidden /> Hear Options
          </button>
          {speech.status !== "idle" && <span className="sr-only" aria-live="polite">Reading aloud</span>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const isSel = selected === opt;
            const isRight = checked && opt === q.correctAnswer;
            const isWrong = checked && isSel && opt !== q.correctAnswer;
            return (
              <label
                key={opt}
                className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl p-4 text-lg font-semibold text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                  isRight ? "bg-tint-green ring-4 ring-emerald-700" : isWrong ? "bg-tint-pink ring-4 ring-rose-700" : isSel ? "bg-brand-soft ring-4 ring-brand" : "bg-white card-border"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  value={opt}
                  checked={isSel}
                  onChange={() => setSelected(opt)}
                  disabled={checked}
                  className="sr-only"
                />
                <span aria-hidden className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold ${isSel ? "bg-brand-deep text-white" : "bg-brand-soft text-brand-deep"}`}>
                  {LETTERS[i]}
                </span>
                <span className="flex-1"><span className="sr-only">Option {LETTERS[i]}: </span>{opt}</span>
                {isSel && !checked && <Check className="size-5 text-brand" aria-label="Selected" />}
                {isRight && <span className="flex items-center gap-1 text-sm"><Check className="size-5" aria-hidden /> Correct answer</span>}
                {isWrong && <span className="flex items-center gap-1 text-sm"><X className="size-5" aria-hidden /> Your answer</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {checked && (
          <div className={`rounded-2xl p-5 text-lg ring-2 ${correct ? "bg-tint-green ring-emerald-700" : "bg-tint-yellow ring-amber-600"}`}>
            <p className="font-bold text-ink">
              {correct ? `That's right! ${q.explanation}` : "Not quite. Let's look at the idea again."}
            </p>
            {!correct && (
              <div className="mt-3">
                <p className="font-bold text-ink">Why?</p>
                <p className="text-ink">The answer is &ldquo;{q.correctAnswer}&rdquo;. {q.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {!checked ? (
          <button
            type="button"
            disabled={!selected}
            onClick={() => setChecked(true)}
            className="min-h-14 rounded-full bg-brand-deep px-8 text-lg font-semibold text-white disabled:opacity-40"
          >
            Check Answer
          </button>
        ) : (
          <button type="button" onClick={next} className="min-h-14 rounded-full bg-brand-deep px-8 text-lg font-semibold text-white">
            {last ? "See My Results" : "Next Question"}
          </button>
        )}
      </div>
    </section>
  );
}
