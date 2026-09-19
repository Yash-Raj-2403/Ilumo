"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useStudent } from "@/components/student/student-provider";
import { EmptyLessons, LessonCard } from "@/components/student/lesson-card";

export default function MyLessons() {
  const { lessons } = useStudent();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-ink">My Lessons</h1>
        <Link href="/student/new" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deep px-6 font-semibold text-white">
          <Plus className="size-5" aria-hidden /> New Material
        </Link>
      </div>
      {lessons.length === 0 ? (
        <EmptyLessons />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => (
            <li key={l.id} className="flex"><div className="flex w-full flex-col [&>article]:flex-1"><LessonCard lesson={l} /></div></li>
          ))}
        </ul>
      )}
    </div>
  );
}
