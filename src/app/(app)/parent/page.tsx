"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AddChildForm } from "@/components/parent/add-child-form";
import { fmtDate, type ChildSummary } from "@/components/parent/child-types";
import { ProgressBar } from "@/components/student/lesson-card";
import { useStudent } from "@/components/student/student-provider";
import { CATEGORIES } from "@/lib/categories";
import { authedFetch } from "@/lib/session/authed-fetch";

export default function ParentDashboard() {
  const { user } = useStudent();
  const [children, setChildren] = useState<ChildSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);
  const formRef = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await authedFetch("/api/parent/children");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setChildren(data.children);
    } catch {
      setError("We couldn't load your children just now.");
      setChildren((c) => c ?? []);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on arrival
    load();
  }, [load]);

  const showForm = adding || children?.length === 0;
  const catName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.short ?? slug;

  return (
    <div className="space-y-10">
      <header>
        <p className="mb-3 inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">PARENT DASHBOARD</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Welcome, {user.name.split(" ")[0]} <span aria-hidden>👋</span></h1>
        <p className="mt-2 text-xl text-body">See what your child is learning and how they&apos;re doing.</p>
      </header>

      {created && (
        <section aria-labelledby="created" className="rounded-3xl bg-tint-green p-6 card-border sm:p-8">
          <h2 id="created" className="text-2xl font-bold text-ink">{created.name}&apos;s account is ready</h2>
          <p className="mt-2 text-lg text-ink">They can log in at <strong>/login</strong> with:</p>
          <dl className="mt-3 grid gap-1 text-lg text-ink sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold">Email</dt><dd>{created.email}</dd>
            <dt className="font-semibold">Password</dt><dd>{created.password}</dd>
          </dl>
          <p className="mt-3 text-base text-body">Save this now. For safety we won&apos;t show the password again.</p>
          <button type="button" onClick={() => setCreated(null)} className="mt-4 min-h-11 rounded-full bg-white px-5 font-semibold text-brand-deep card-border">Done</button>
        </section>
      )}

      <section aria-labelledby="kids">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="kids" className="text-2xl font-bold text-ink">Your children</h2>
          {!showForm && (
            <button type="button" onClick={() => { setAdding(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.3)]">
              <Plus className="size-5" aria-hidden /> Add a child
            </button>
          )}
        </div>
        {error && <p role="alert" className="mb-4 rounded-2xl bg-tint-yellow p-4 font-semibold text-ink">{error} <button type="button" onClick={load} className="underline">Try again</button></p>}
        {children === null ? (
          <p role="status" className="text-lg text-body">Loading...</p>
        ) : children.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-brand-deep/30 bg-white p-8 text-center text-lg text-body">You haven&apos;t added a child yet. Create their account below to get started.</p>
        ) : (
          <ul className="grid gap-5 lg:grid-cols-2">
            {children.map((c) => (
              <li key={c.id}>
                <article className="flex h-full flex-col gap-4 rounded-3xl bg-white p-6 card-border">
                  <div>
                    <h3 className="text-2xl font-bold text-ink">{c.name}</h3>
                    <p className="text-body">{c.age ? `Age ${c.age} · ` : ""}{c.email}</p>
                  </div>
                  <ul className="flex flex-wrap gap-2" aria-label="Support">
                    {c.supports.map((s) => <li key={s} className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-deep">{catName(s)}</li>)}
                  </ul>
                  <dl className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-tint-blue p-3"><dt className="text-sm text-body">Lessons</dt><dd className="text-2xl font-bold text-ink">{c.lessonCount}</dd></div>
                    <div className="rounded-2xl bg-tint-green p-3"><dt className="text-sm text-body">Completed</dt><dd className="text-2xl font-bold text-ink">{c.completedCount}</dd></div>
                    <div className="rounded-2xl bg-tint-yellow p-3"><dt className="text-sm text-body">Quiz average</dt><dd className="text-2xl font-bold text-ink">{c.avgQuizPercent === null ? "None yet" : `${c.avgQuizPercent}%`}</dd></div>
                  </dl>
                  {c.lessonCount > 0 && <ProgressBar value={c.avgProgress} label="Average lesson progress" />}
                  <p className="text-sm text-body">Last active: {fmtDate(c.lastActive)}</p>
                  <Link href={`/parent/children/${c.id}`} className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full bg-brand-deep px-6 font-semibold text-white">
                    See {c.name}&apos;s progress
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showForm && (
        <section ref={formRef} aria-labelledby="add" className="scroll-mt-28 rounded-3xl bg-white p-6 card-border sm:p-8">
          <h2 id="add" className="text-2xl font-bold text-ink">Add your child</h2>
          <p className="mb-6 mt-1 text-lg text-body">This creates your child&apos;s own ILUMO login, linked to your account so you can follow their learning.</p>
          <AddChildForm
            onCreated={(c, login) => {
              setChildren((list) => [...(list ?? []), c]);
              setCreated({ name: c.name, ...login });
              setAdding(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>
      )}
    </div>
  );
}
