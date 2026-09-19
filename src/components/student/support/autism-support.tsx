"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Image as ImageIcon, PenLine, RotateCcw, Square, Star, Volume2 } from "lucide-react";
import sampleLesson from "@/data/mockPhotosynthesisLesson.json";
import type { Lesson } from "@/lib/lesson-types";
import { lessonsFor } from "@/lib/categories";
import { LessonVisual } from "../lesson-visual";
import { useStudent } from "../student-provider";

// Autism / neurodivergence support. The same lesson is always laid out the same way:
// a visual schedule, then one task at a time, with simple instructions and repeatable steps.

type Task =
  | { kind: "read"; label: string; title: string; lines: string[] }
  | { kind: "look"; label: string }
  | { kind: "practice"; label: string; question: string; options: string[]; answer: string; explanation: string }
  | { kind: "done"; label: string };

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const SAMPLE: Lesson = { ...(sampleLesson as unknown as Lesson), id: "sample", createdAt: "", source: "mock", visual: { kind: "sample" } };

function buildTasks(lesson: Lesson): Task[] {
  const reads: Task[] = lesson.sections.map((s, i) => ({
    kind: "read",
    label: `Read ${i + 1}`,
    title: s.heading,
    lines: sentences(s.content),
  }));
  const practice: Task[] = lesson.quiz.slice(0, 3).map((q, i) => ({
    kind: "practice",
    label: `Practice ${i + 1}`,
    question: q.question,
    options: q.options,
    answer: q.correctAnswer,
    explanation: q.explanation,
  }));
  const look: Task[] = lesson.visual || lesson.visualDescriptions.length > 0 ? [{ kind: "look", label: "Look" }] : [];
  return [...reads, ...look, ...practice, { kind: "done", label: "All done" }];
}

function TaskIcon({ task, className }: { task: Task; className?: string }) {
  if (task.kind === "read") return <BookOpen className={className} aria-hidden />;
  if (task.kind === "look") return <ImageIcon className={className} aria-hidden />;
  if (task.kind === "practice") return <PenLine className={className} aria-hidden />;
  return <Star className={className} aria-hidden />;
}

export function AutismSupport() {
  const { lessons, speakOne, stopQueue } = useStudent();
  const [source, setSource] = useState<Lesson | null>(null);

  if (!source) {
    return <Picker lessons={lessonsFor(lessons, "autism")} onPick={setSource} />;
  }
  return (
    <div className="calm-theme -m-4 rounded-3xl bg-canvas p-4 sm:-m-6 sm:p-6">
      <Session
        key={source.id}
        lesson={source}
        speak={speakOne}
        stop={stopQueue}
        onExit={() => setSource(null)}
      />
    </div>
  );
}

function Picker({ lessons, onPick }: { lessons: Lesson[]; onPick: (l: Lesson) => void }) {
  const list = "grid gap-4 sm:grid-cols-2";
  const card = "flex flex-col items-start gap-3 rounded-3xl bg-white p-6 text-left card-border";
  return (
    <div className="calm-theme -m-4 min-h-[60vh] space-y-8 rounded-3xl bg-canvas p-4 sm:-m-6 sm:p-6">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink">Autism &amp; Neurodivergence Support</h1>
        <p className="mt-3 text-xl leading-relaxed text-body">
          Calm, predictable learning. Every lesson has the same shape: a picture schedule, then one small task at a time.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-base font-semibold text-brand-deep">
          {["Visual schedule", "Simple instructions", "One task at a time", "Quiet screen", "Easy to repeat"].map((f) => (
            <li key={f} className="rounded-full bg-brand-soft px-4 py-1.5">{f}</li>
          ))}
        </ul>
      </header>

      <section aria-labelledby="pick">
        <h2 id="pick" className="mb-4 text-2xl font-bold text-ink">Choose a lesson</h2>
        <ul className={list}>
          <li>
            <button type="button" onClick={() => onPick(SAMPLE)} className={`${card} w-full hover:bg-brand-soft`}>
              <span className="text-xl font-bold text-ink">Photosynthesis</span>
              <span className="text-body">Sample lesson. Good for trying this out.</span>
              <span className="mt-1 font-semibold text-brand">Start</span>
            </button>
          </li>
          {lessons.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onPick(l)} className={`${card} w-full hover:bg-brand-soft`}>
                <span className="text-xl font-bold text-ink">{l.title}</span>
                <span className="line-clamp-2 text-body">{l.summary}</span>
                <span className="mt-1 font-semibold text-brand">Start</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-body">
          Want to use your own material? <Link href="/student/new" className="font-semibold text-brand underline underline-offset-4">Upload it first</Link>, then come back here.
        </p>
      </section>
    </div>
  );
}

function Session({ lesson, speak, stop, onExit }: {
  lesson: Lesson;
  speak: (id: string, text: string, onEnd?: () => void) => void;
  stop: () => void;
  onExit: () => void;
}) {
  const title = lesson.title;
  const tasks = useMemo(() => buildTasks(lesson), [lesson]);
  const [reading, setReading] = useState(false);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const task = tasks[i];
  const next = tasks[i + 1];

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [i]);
  useEffect(() => () => stop(), [stop]); // leaving the lesson stops any reading

  const go = (n: number) => {
    stop();
    setReading(false);
    setI(Math.max(0, Math.min(tasks.length - 1, n)));
    setPicked(null);
    setChecked(false);
  };

  /** Read this task out loud, then carry on to the next ones. It stops at a question, so it waits for the answer. */
  function readFrom(n: number) {
    const t = tasks[n];
    if (!t || t.kind === "done") return setReading(false);
    setReading(true);
    setI(n);
    setPicked(null);
    setChecked(false);
    const text =
      t.kind === "read" ? `${t.title}. ${t.lines.join(" ")}`
      : t.kind === "look" ? `Look at the picture. ${lesson.visualDescriptions[0]?.description ?? ""}`
      : t.kind === "practice" ? `${t.question}. ${t.options.map((o, k) => `${LETTERS[k]}. ${o}`).join(". ")}`
      : "";
    speak(`task-${n}`, text, () => (t.kind === "read" || t.kind === "look" ? readFrom(n + 1) : setReading(false)));
  }
  const stopReading = () => {
    stop();
    setReading(false);
  };
  const big = "min-h-16 rounded-2xl px-8 text-xl font-bold";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-body">Autism &amp; Neurodivergence Support</p>
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        </div>
        <button type="button" onClick={onExit} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-semibold text-brand-deep card-border">
          <ArrowLeft className="size-4" aria-hidden /> Choose another lesson
        </button>
      </header>

      <nav aria-label="Visual schedule">
        <h2 className="mb-3 text-xl font-bold text-ink">My schedule</h2>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tasks.map((t, n) => {
            const state = n < i ? "Done" : n === i ? "Now" : "Later";
            return (
              <li
                key={n}
                aria-current={n === i ? "step" : undefined}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  n === i ? "bg-brand-deep text-white ring-4 ring-brand/40" : n < i ? "bg-white text-body card-border" : "bg-white text-ink card-border"
                }`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${n === i ? "bg-white/15" : "bg-brand-soft text-brand-deep"}`}>
                  {n < i ? <Check className="size-6" aria-hidden /> : <TaskIcon task={t} className="size-6" />}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-bold">{t.label}</span>
                  <span className="block text-sm">{state}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <section aria-labelledby="now" className="rounded-[2rem] bg-white p-6 card-border sm:p-10">
        <p className="mb-2 flex items-center gap-2 text-lg font-bold text-brand">
          <TaskIcon task={task} className="size-6" /> Task {Math.min(i + 1, tasks.length - 1)} of {tasks.length - 1}
        </p>

        {task.kind === "read" && (
          <>
            <h2 id="now" ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-ink outline-none">{task.title}</h2>
            <p className="mt-2 text-lg font-semibold text-body">Read this. Then press Done.</p>
            <ul className="mt-6 space-y-4">
              {task.lines.map((l, n) => (
                <li key={n} className="flex gap-4 text-2xl leading-relaxed text-ink">
                  <span aria-hidden className="mt-3 size-3 shrink-0 rounded-full bg-brand" />
                  {l}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => go(i + 1)} className={`${big} bg-brand text-white`}>Done <span aria-hidden>✓</span></button>
              <button type="button" onClick={() => speak(`task-${i}`, `${task.title}. ${task.lines.join(" ")}`)} className={`${big} inline-flex items-center gap-2 bg-white text-brand-deep card-border`}>
                <Volume2 className="size-5" aria-hidden /> Listen
              </button>
              <button type="button" aria-pressed={reading} onClick={() => (reading ? stopReading() : readFrom(i))} className={`${big} inline-flex items-center gap-2 card-border ${reading ? "bg-brand-deep text-white" : "bg-white text-brand-deep"}`}>
                {reading ? <><Square className="size-5" aria-hidden /> Stop reading</> : <><Volume2 className="size-5" aria-hidden /> Read from here</>}
              </button>
            </div>
          </>
        )}

        {task.kind === "look" && (
          <>
            <h2 id="now" ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-ink outline-none">Look at the picture</h2>
            <p className="mt-2 text-lg font-semibold text-body">Look at it. Press Describe image if you want it in words. Then press Done.</p>
            <div className="mt-6"><LessonVisual lesson={lesson} /></div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => go(i + 1)} className={`${big} bg-brand text-white`}>Done <span aria-hidden>✓</span></button>
              <button type="button" aria-pressed={reading} onClick={() => (reading ? stopReading() : readFrom(i))} className={`${big} inline-flex items-center gap-2 card-border ${reading ? "bg-brand-deep text-white" : "bg-white text-brand-deep"}`}>
                {reading ? <><Square className="size-5" aria-hidden /> Stop reading</> : <><Volume2 className="size-5" aria-hidden /> Read from here</>}
              </button>
            </div>
          </>
        )}

        {task.kind === "practice" && (
          <>
            <h2 id="now" ref={headingRef} tabIndex={-1} className="text-3xl font-bold leading-snug text-ink outline-none">{task.question}</h2>
            <p className="mt-2 text-lg font-semibold text-body">Tap one answer. Then press Check.</p>
            <fieldset className="mt-6">
              <legend className="sr-only">Answers</legend>
              <div className="grid gap-3">
                {task.options.map((o) => {
                  const on = picked === o;
                  const right = checked && o === task.answer;
                  return (
                    <label
                      key={o}
                      className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl p-4 text-xl font-semibold text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                        right ? "bg-tint-green ring-4 ring-emerald-700" : on ? "bg-brand-soft ring-4 ring-brand" : "bg-white card-border"
                      }`}
                    >
                      <input type="radio" name="practice" value={o} checked={on} disabled={checked} onChange={() => setPicked(o)} className="sr-only" />
                      <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-full ring-2 ring-brand-deep/40 ${on ? "bg-brand-deep text-white" : ""}`}>{on && <Check className="size-5" />}</span>
                      {o}
                      {right && <span className="ml-auto text-base">Right answer</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div aria-live="polite" className="mt-5">
              {checked && (
                <p className="rounded-2xl bg-tint-yellow p-5 text-xl leading-relaxed text-ink">
                  {picked === task.answer ? "Good job! " : "Good try. "}
                  {task.explanation}
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {!checked ? (
                <button type="button" disabled={!picked} onClick={() => setChecked(true)} className={`${big} bg-brand text-white disabled:opacity-40`}>Check</button>
              ) : (
                <button type="button" onClick={() => go(i + 1)} className={`${big} bg-brand text-white`}>Next <span aria-hidden>→</span></button>
              )}
              <button type="button" onClick={() => speak(`task-${i}`, `${task.question}. ${task.options.join(". ")}`)} className={`${big} inline-flex items-center gap-2 bg-white text-brand-deep card-border`}>
                <Volume2 className="size-5" aria-hidden /> Listen
              </button>
              <button type="button" aria-pressed={reading} onClick={() => (reading ? stopReading() : readFrom(i))} className={`${big} inline-flex items-center gap-2 card-border ${reading ? "bg-brand-deep text-white" : "bg-white text-brand-deep"}`}>
                {reading ? <><Square className="size-5" aria-hidden /> Stop reading</> : <><Volume2 className="size-5" aria-hidden /> Read from here</>}
              </button>
            </div>
          </>
        )}

        {task.kind === "done" && (
          <div className="text-center">
            <Star className="mx-auto size-16 text-amber-500" aria-hidden />
            <h2 id="now" ref={headingRef} tabIndex={-1} className="mt-4 text-4xl font-bold text-ink outline-none">All done!</h2>
            <p className="mt-3 text-2xl text-body">You finished every task. Well done.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => go(0)} className={`${big} inline-flex items-center gap-2 bg-brand text-white`}>
                <RotateCcw className="size-5" aria-hidden /> Do it again
              </button>
              <button type="button" onClick={onExit} className={`${big} bg-white text-brand-deep card-border`}>Choose another lesson</button>
            </div>
          </div>
        )}
      </section>

      {task.kind !== "done" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 text-lg card-border">
          <p><span className="font-bold text-ink">First:</span> {task.label}. <span className="font-bold text-ink">Then:</span> {next ? next.label : "All done"}.</p>
          {i > 0 && (
            <button type="button" onClick={() => go(i - 1)} className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-semibold text-brand-deep underline underline-offset-4">
              <ArrowLeft className="size-4" aria-hidden /> Go back one task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
