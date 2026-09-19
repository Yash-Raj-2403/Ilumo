"use client";

import Link from "next/link";
import { BookOpen, LineChart, Settings, Sparkles, Upload, Dumbbell } from "lucide-react";
import { GAMES } from "@/components/student/games/catalog";
import { CATEGORIES, categoryHref } from "@/lib/categories";
import { useStudent } from "@/components/student/student-provider";
import { EmptyLessons, LessonCard, ProgressBar } from "@/components/student/lesson-card";

const primary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-deep px-6 font-semibold text-white hover:bg-[#1a1450]";

export default function StudentHome() {
  return (
    <>
      <HomeContent />
    </>
  );
}

function HomeContent() {
  const { student, lessons, progress, lessonProgress, supports, settings } = useStudent();

  const recent = [...lessons].sort(
    (a, b) => (progress[b.id]?.updatedAt ?? b.createdAt).localeCompare(progress[a.id]?.updatedAt ?? a.createdAt),
  )[0];

  const quick = [
    { href: "/student/lessons", label: "My Lessons", icon: BookOpen },
    { href: "/student/new", label: "Practice", icon: Dumbbell },
    { href: "/student/progress", label: "Progress", icon: LineChart },
    { href: "/student/settings", label: "Accessibility Settings", icon: Settings },
  ];

  return (
    <div className="space-y-12">
      <header>
        <p className="mb-3 inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">DASHBOARD</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Welcome back, {student.name} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-2 text-xl text-body">Ready to learn something new?</p>
      </header>

      {settings.explore && (
        <section aria-labelledby="explore-h" className="rounded-3xl bg-tint-yellow p-6 card-border sm:p-8">
          <h2 id="explore-h" className="text-3xl font-bold text-ink">Game Zone <span aria-hidden>🎮</span></h2>
          <p className="mt-1 text-xl text-body">Short games with pictures, sounds and kind hints.</p>
          <ul className="mt-5 flex flex-wrap gap-3" aria-label="Games">
            {GAMES.map((g) => (
              <li key={g.id}>
                <Link href={`/student/games/${g.id}`} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white px-5 text-lg font-bold text-ink card-border hover:bg-brand-soft">
                  <span aria-hidden className="text-2xl">{g.emoji}</span>{g.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/student/games" className="inline-flex min-h-14 items-center rounded-full px-5 text-lg font-bold text-brand underline underline-offset-4">See all games</Link>
            </li>
          </ul>
        </section>
      )}

      <section aria-labelledby="continue">
        <h2 id="continue" className="mb-4 text-2xl font-bold text-ink">Continue Learning</h2>
        {recent ? (
          <div className="grid gap-5 rounded-3xl bg-tint-purple p-6 card-border sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-ink">{recent.title}</h3>
              <ProgressBar value={lessonProgress(recent)} label="Progress" />
            </div>
            <Link href={`/student/lesson/${recent.id}`} className={primary}>
              Continue Learning<span className="sr-only">: {recent.title}</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 rounded-3xl bg-tint-purple p-6 card-border sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h3 className="text-2xl font-bold text-ink">Photosynthesis</h3>
              <p className="mt-1 text-body">Sample lesson. Nothing started yet.</p>
            </div>
            <Link href="/student/new?sample=1" className={primary}>Start Sample Lesson</Link>
          </div>
        )}
      </section>

      <section aria-labelledby="mine">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="mine" className="text-2xl font-bold text-ink">My Lessons</h2>
          {lessons.length > 3 && <Link href="/student/lessons" className="font-semibold text-brand underline underline-offset-4">See all</Link>}
        </div>
        {lessons.length === 0 ? (
          <EmptyLessons />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.slice(0, 3).map((l) => (
              <li key={l.id} className="flex"><div className="flex w-full flex-col [&>article]:flex-1"><LessonCard lesson={l} /></div></li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="new" className="rounded-3xl bg-brand-deep p-8 text-white sm:p-10">
        <Sparkles className="mb-3 size-8 text-[#ffb434]" aria-hidden />
        <h2 id="new" className="text-3xl font-bold">Learn Something New</h2>
        <p className="mt-2 max-w-xl text-lg text-white/85">Turn any learning material into an accessible lesson.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/student/new" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand-deep">
            <Upload className="size-5" aria-hidden /> Upload Material
          </Link>
          <Link href="/student/new?sample=1" className="inline-flex min-h-12 items-center rounded-full px-6 font-semibold text-white ring-2 ring-white">
            Start with Sample
          </Link>
        </div>
      </section>

      <section aria-labelledby="support">
        <h2 id="support" className="mb-4 text-2xl font-bold text-ink">Learning Support</h2>
        {settings.supports === null && (
          <p className="mb-4 rounded-2xl bg-tint-yellow p-4 text-lg text-ink ring-1 ring-brand-deep/10">
            Tell us what support helps you most and we&apos;ll show only the tools that fit.{" "}
            <Link href="/student/settings#support" className="font-semibold text-brand underline underline-offset-4">Choose my support</Link>
          </p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.filter((c) => supports.includes(c.slug)).map((c) => (
            <li key={c.slug}>
              {c.ready ? (
                <Link href={categoryHref(c)} className={`flex h-full flex-col gap-1 rounded-3xl ${c.card} p-5 text-ink card-border hover:shadow-lg`}>
                  <span className="text-lg font-bold">{c.title}</span>
                  <span className="text-body">{c.summary}</span>
                  <span className="mt-2 font-semibold text-brand">Open</span>
                </Link>
              ) : (
                <div className="flex h-full flex-col gap-1 rounded-3xl bg-white p-5 text-ink card-border">
                  <span className="text-lg font-bold">{c.title}</span>
                  <span className="text-body">{c.summary}</span>
                  <span className="mt-2 font-semibold text-body">Coming soon</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="quick">
        <h2 id="quick" className="mb-4 text-2xl font-bold text-ink">Quick Actions</h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quick.map(({ href, label, icon: Icon }) => (
            <li key={label}>
              <Link href={href} className="flex h-full min-h-28 flex-col items-start justify-between gap-3 rounded-3xl bg-white p-5 font-semibold text-ink card-border hover:bg-brand-soft">
                <Icon className="size-7 text-brand" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
