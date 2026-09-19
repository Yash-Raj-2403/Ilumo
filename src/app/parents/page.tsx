import type { Metadata } from "next";
import { PageHeader, SiteShell } from "@/components/landing/site-shell";
import { ParentsCta } from "@/components/landing/parents-cta";

export const metadata: Metadata = { title: "For Parents — ILUMO", description: "Add your child, choose the support that helps, and follow what they are learning." };

const STEPS = [
  { n: 1, title: "Sign up as a parent", text: "Create your own parent account with your email and a password." },
  { n: 2, title: "Add your child", text: "Enter their name, age and the kind of support that helps them. ILUMO creates their learning account for you." },
  { n: 3, title: "Your child learns", text: "They sign in with their own details. Lessons, games and reading are shaped around the support you chose." },
  { n: 4, title: "You follow along", text: "See lessons started and finished, quiz results, Game Zone stars and when they were last active." },
];

const POINTS = [
  "Change your child's support needs at any time",
  "See what they are learning, in plain words",
  "No ads, and your child's lessons stay private to your family",
  "You keep control: only you can add or manage your child's account",
];

export default function ForParents() {
  return (
    <SiteShell>
      <PageHeader eyebrow="FOR PARENTS" title="Follow your child's learning">
        A parent space where you add your child, choose the support that helps them, and see how they are getting on.
      </PageHeader>

      <div className="mx-auto max-w-5xl space-y-14 px-4 pb-20 sm:px-6">
        <section aria-labelledby="start" className="rounded-3xl bg-tint-purple p-8 ring-1 ring-brand-deep/10 sm:p-10">
          <h2 id="start" className="text-3xl font-bold text-ink">Get started</h2>
          <div className="mt-5"><ParentsCta /></div>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="text-3xl font-bold text-ink">How it works</h2>
          <ol className="mt-6 grid gap-5 sm:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-3xl bg-white p-6 ring-1 ring-brand-deep/10">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-deep text-xl font-extrabold text-white">{s.n}</span>
                <div>
                  <h3 className="text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-lg text-body">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="good">
          <h2 id="good" className="text-3xl font-bold text-ink">What you get</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3 rounded-2xl bg-tint-green p-5 text-lg font-semibold text-ink ring-1 ring-black/10">
                <span aria-hidden>✓</span>{p}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
