"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { EXPLORE_TOPICS, type ExploreTopic } from "@/data/explore";
import type { Lesson } from "@/lib/lesson-types";
import { CATEGORIES } from "@/lib/categories";
import { ProgressBar } from "./lesson-card";
import { useStudent } from "./student-provider";

/** Ready-made basics for ages 5 to 10. Each topic opens in the normal lesson viewer, so every support works. */
export function ExploreShelf({ embedded = false }: { embedded?: boolean }) {
  const { lessons, lessonProgress, saveLesson, settings, supports } = useStudent();
  const router = useRouter();

  // A topic becomes a saved lesson the first time it is opened, so progress is kept and parents can see it.
  function open(t: ExploreTopic) {
    let lesson = lessons.find((l) => l.topic === t.slug);
    if (!lesson) {
      lesson = {
        ...t.content,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        source: "mock",
        topic: t.slug,
        supports: settings.supports ?? [],
        visual: { kind: "emoji", items: t.pictures },
      } as Lesson;
      saveLesson(lesson);
    }
    router.push(`/student/lesson/${lesson.id}`);
  }

  const mine = CATEGORIES.filter((c) => supports.includes(c.slug) && settings.supports).map((c) => c.short);

  return (
    <div className="space-y-8">
      {!embedded && (
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Let&apos;s explore! <span aria-hidden>🌈</span></h1>
        </header>
      )}
      <p className="max-w-prose text-xl text-body">
        Pick a topic. Every lesson has pictures, read-aloud, cards to flip and a friendly quiz.
        {mine.length > 0 && ` It uses your support: ${mine.join(", ")}.`}
      </p>

      {!embedded && !settings.explore && (
        <p className="rounded-2xl bg-tint-yellow p-4 text-lg text-ink ring-1 ring-brand-deep/10">
          Explore is switched off for this account.{" "}
          <Link href="/student/settings#explore" className="font-semibold text-brand underline underline-offset-4">Turn it on in Settings</Link>
        </p>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EXPLORE_TOPICS.map((t) => {
          const existing = lessons.find((l) => l.topic === t.slug);
          const pct = existing ? lessonProgress(existing) : 0;
          return (
            <li key={t.slug} id={t.slug} className="flex">
              <button
                type="button"
                onClick={() => open(t)}
                className={`flex min-h-56 w-full flex-col items-start gap-3 rounded-3xl ${t.card} p-6 text-left text-ink card-border hover:shadow-lg focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand`}
              >
                <span aria-hidden className="text-6xl leading-none">{t.emoji}</span>
                <span className="text-2xl font-bold">{t.content.title}</span>
                <span className="text-lg text-body">{t.blurb}</span>
                <span className="mt-auto w-full">
                  {existing && <ProgressBar value={pct} label="Progress" />}
                  <span className="mt-2 inline-block font-semibold text-brand">{existing ? (pct > 0 ? "Keep going" : "Open") : "Start"}<span className="sr-only">: {t.content.title}</span></span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
