import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, SiteShell } from "@/components/landing/site-shell";
import { getImpactStats } from "@/lib/server/stats";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = { title: "Our Impact — ILUMO", description: "What ILUMO is doing, in real numbers." };
export const revalidate = 300; // numbers refresh every few minutes

const GOALS = [
  { title: "Nobody left out of the lesson", text: "Every kind of learner should be able to use the same material, in the form that works for them." },
  { title: "Independence first", text: "Tools like read-aloud, captions, switch access and AAC let students work without needing someone beside them." },
  { title: "Families in the loop", text: "Parents can see what their child is learning and where they need more practice." },
];

export default async function Impact() {
  const stats = await getImpactStats();
  const items = stats
    ? [
        { label: "Learners", value: stats.learners, bg: "bg-tint-blue" },
        { label: "Parents & carers", value: stats.families, bg: "bg-tint-pink" },
        { label: "Lessons adapted", value: stats.lessons, bg: "bg-tint-green" },
        { label: "Quizzes completed", value: stats.quizzes, bg: "bg-tint-yellow" },
      ]
    : [];

  return (
    <SiteShell>
      <PageHeader eyebrow="OUR IMPACT" title="A more inclusive tomorrow starts today">
        We are early, so we share only what is real. These numbers come straight from ILUMO right now.
      </PageHeader>

      <div className="mx-auto max-w-5xl space-y-16 px-4 pb-20 sm:px-6">
        <section aria-labelledby="numbers">
          <h2 id="numbers" className="sr-only">ILUMO in numbers</h2>
          {stats ? (
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {items.map((s) => (
                <div key={s.label} className={`rounded-3xl ${s.bg} p-6 text-center ring-1 ring-brand-deep/10`}>
                  <dd className="text-4xl font-extrabold text-brand-deep sm:text-5xl">{s.value.toLocaleString()}</dd>
                  <dt className="mt-1 font-semibold text-ink">{s.label}</dt>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-3xl bg-white p-6 text-center text-lg text-body ring-1 ring-brand-deep/10">Live numbers aren&apos;t available right now. Please check back soon.</p>
          )}
          <p className="mt-3 text-center text-sm text-body">Counts of accounts, lessons and quizzes on ILUMO. No personal details are shown.</p>
        </section>

        <section aria-labelledby="goals">
          <h2 id="goals" className="text-3xl font-bold text-ink">What we are working toward</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {GOALS.map((g) => (
              <li key={g.title} className="rounded-3xl bg-white p-6 ring-1 ring-brand-deep/10">
                <h3 className="text-xl font-bold text-ink">{g.title}</h3>
                <p className="mt-2 text-lg text-body">{g.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="supports">
          <h2 id="supports" className="text-3xl font-bold text-ink">Six kinds of support in one place</h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <li key={c.slug} className={`rounded-full ${c.card} px-5 py-2.5 font-semibold text-ink ring-1 ring-brand-deep/10`}>{c.title}</li>
            ))}
          </ul>
        </section>

        <p className="text-center">
          <Link href="/blog" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]">
            Read our awareness posts <ArrowRight className="size-5" aria-hidden />
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
