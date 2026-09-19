"use client";

import { findTopic } from "@/data/explore";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { Lesson } from "@/lib/lesson-types";
import { useStudent } from "./student-provider";

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-semibold text-body">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 overflow-hidden rounded-full bg-brand-soft ring-1 ring-brand-deep/15"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const { lessonProgress } = useStudent();
  const pct = lessonProgress(lesson);
  return (
    <article className={`flex flex-col gap-4 rounded-3xl ${lesson.topic ? (findTopic(lesson.topic)?.card ?? "bg-white") : "bg-white"} p-6 shadow-[0_8px_30px_rgba(37,29,107,0.07)] card-border`}>
      <div>
        <h3 className="text-xl font-bold text-ink">{lesson.title}</h3>
        <p className="mt-1 line-clamp-2 text-body">{lesson.summary}</p>
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-tint-blue px-3 py-1 text-sm font-semibold text-brand-deep ring-1 ring-brand-deep/15">
        <Eye className="size-4" aria-hidden /> Visual support on
      </span>
      <ProgressBar value={pct} label="Progress" />
      <Link
        href={`/student/lesson/${lesson.id}`}
        className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full bg-brand-deep px-6 font-semibold text-white hover:bg-[#1a1450]"
      >
        {pct > 0 ? "Continue" : "Start"}<span className="sr-only">&nbsp;{lesson.title}</span>
      </Link>
    </article>
  );
}

export function EmptyLessons() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-brand-deep/30 bg-white p-8 text-center">
      <p className="text-lg font-semibold text-ink">No lessons yet</p>
      <p className="mt-1 text-body">Upload something you&apos;re learning, or start with the photosynthesis sample.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/student/new" className="inline-flex min-h-12 items-center rounded-full bg-brand-deep px-6 font-semibold text-white">
          Upload Material
        </Link>
        <Link href="/student/new?sample=1" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-brand-deep card-border">
          Start with Sample
        </Link>
      </div>
    </div>
  );
}
