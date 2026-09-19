"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useStudent } from "@/components/student/student-provider";
import { EmptyLessons, ProgressBar } from "@/components/student/lesson-card";

export default function ProgressPage() {
  const { lessons, progress, lessonProgress } = useStudent();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-ink">Learning Progress</h1>
        <p className="mt-2 text-lg text-body">Everything here comes from the lessons you&apos;ve actually done.</p>
      </header>

      {lessons.length === 0 ? (
        <EmptyLessons />
      ) : (
        <section aria-labelledby="journey">
          <h2 id="journey" className="mb-4 text-2xl font-bold text-ink">Your Learning Journey</h2>
          <ul className="space-y-5">
            {lessons.map((l) => {
              const p = progress[l.id];
              const pct = lessonProgress(l);
              const read = Math.min(p?.sectionsRead.length ?? 0, l.sections.length);
              return (
                <li key={l.id} className="rounded-3xl bg-white p-6 card-border">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-ink">{l.title}</h3>
                    {pct === 100 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-green px-3 py-1 text-sm font-bold text-ink ring-1 ring-black/15">
                        <Check className="size-4" aria-hidden /> Completed
                      </span>
                    )}
                  </div>
                  <dl className="mt-3 grid gap-3 text-body sm:grid-cols-3">
                    <div><dt className="font-semibold text-ink">Quiz</dt><dd>{p?.quiz ? `${p.quiz.feedback.score} / ${p.quiz.feedback.total}` : "Not taken yet"}</dd></div>
                    <div><dt className="font-semibold text-ink">Sections completed</dt><dd>{read} / {l.sections.length}</dd></div>
                    <div><dt className="font-semibold text-ink">Accessibility</dt><dd>Visual Support enabled</dd></div>
                  </dl>
                  <div className="mt-4"><ProgressBar value={pct} label="Lesson progress" /></div>
                  {p?.quiz && <p className="mt-3 text-body">{p.quiz.feedback.feedback}</p>}
                  <Link href={`/student/lesson/${l.id}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">
                    {pct === 100 ? "Review lesson" : "Continue learning"}<span className="sr-only">: {l.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
