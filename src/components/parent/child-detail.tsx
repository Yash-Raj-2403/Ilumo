"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fmtDate, type ChildLesson, type ChildSummary } from "./child-types";
import { ProgressBar } from "@/components/student/lesson-card";
import { CATEGORIES } from "@/lib/categories";
import { authedFetch } from "@/lib/supabase/authed-fetch";

export function ChildDetail({ id }: { id: string }) {
  const [data, setData] = useState<{ child: ChildSummary; lessons: ChildLesson[] } | null | "error">(null);

  useEffect(() => {
    let alive = true;
    authedFetch(`/api/parent/children/${id}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setData(d))
      .catch(() => alive && setData("error"));
    return () => {
      alive = false;
    };
  }, [id]);

  const back = (
    <Link href="/parent" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand underline underline-offset-4">
      <ArrowLeft className="size-4" aria-hidden /> Back to dashboard
    </Link>
  );
  if (data === null) return <p role="status" className="text-lg text-body">Loading...</p>;
  if (data === "error")
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-ink">We couldn&apos;t find that child.</h1>
        {back}
      </div>
    );

  const { child, lessons } = data;
  const catName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.title ?? slug;
  const stats = [
    { label: "Lessons", value: child.lessonCount, bg: "bg-tint-blue" },
    { label: "Completed", value: child.completedCount, bg: "bg-tint-green" },
    { label: "Quiz average", value: child.avgQuizPercent === null ? "None yet" : `${child.avgQuizPercent}%`, bg: "bg-tint-yellow" },
    { label: "Game Zone stars", value: child.gameStars, bg: "bg-tint-pink" },
    { label: "Last active", value: fmtDate(child.lastActive), bg: "bg-tint-purple" },
  ];

  return (
    <div className="space-y-8">
      {back}
      <header>
        <p className="mb-3 inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">PROGRESS</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">{child.name}</h1>
        <p className="mt-2 text-lg text-body">{child.age ? `Age ${child.age} · ` : ""}{child.email}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Support">
          {child.supports.map((s) => <li key={s} className="rounded-full bg-brand-soft px-4 py-1.5 text-sm font-semibold text-brand-deep">{catName(s)}</li>)}
        </ul>
      </header>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-3xl ${s.bg} p-5 card-border`}>
            <dt className="text-sm font-semibold text-body">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="learning">
        <h2 id="learning" className="mb-4 text-2xl font-bold text-ink">What {child.name} is learning</h2>
        {lessons.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-brand-deep/30 bg-white p-8 text-center text-lg text-body">{child.name} hasn&apos;t started a lesson yet. Once they log in and add some material, it will show up here.</p>
        ) : (
          <ul className="space-y-5">
            {lessons.map((l) => (
              <li key={l.id}>
                <article className="space-y-4 rounded-3xl bg-white p-6 card-border sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-bold text-ink">{l.title}</h3>
                      <p className="text-sm text-body">Started {fmtDate(l.createdAt)} · Last worked on {fmtDate(l.updatedAt)}</p>
                    </div>
                    <span className={`rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-black/10 ${l.progress === 100 ? "bg-tint-green text-ink" : "bg-tint-yellow text-ink"}`}>
                      {l.progress === 100 ? "✓ Completed" : "In progress"}
                    </span>
                  </div>
                  {l.summary && <p className="text-lg text-ink">{l.summary}</p>}
                  {l.keyPoints.length > 0 && (
                    <div>
                      <h4 className="font-bold text-ink">Main ideas</h4>
                      <ul className="mt-1 list-disc space-y-1 pl-6 text-ink">{l.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
                    </div>
                  )}
                  <ProgressBar value={l.progress} label={`Sections read: ${l.sectionsRead} of ${l.sectionsTotal}`} />
                  {l.quiz ? (
                    <div className="rounded-2xl bg-tint-purple p-5">
                      <h4 className="font-bold text-ink">Quiz: {l.quiz.score} out of {l.quiz.total}</h4>
                      <p className="mt-1 text-ink">{l.quiz.feedback}</p>
                      {l.quiz.needsPractice.length > 0 && (
                        <p className="mt-2 text-ink"><strong>Worth another look:</strong> {l.quiz.needsPractice.join("; ")}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-body">Quiz not taken yet.</p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
