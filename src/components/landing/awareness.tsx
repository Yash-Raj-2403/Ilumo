import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { POSTS } from "@/data/blogPosts";

// Small, colourful awareness posts for the landing page. Each opens a full short article.
const TILT = ["-rotate-1", "rotate-1", "rotate-[0.6deg]", "-rotate-[0.8deg]"];

export function Awareness() {
  return (
    <section id="awareness" aria-labelledby="awareness-h" className="relative scroll-mt-24 overflow-hidden py-20">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-[#fde8ee] opacity-70 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-10 size-72 rounded-full bg-[#e2eefe] opacity-70 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">AWARENESS CORNER</p>
          <h2 id="awareness-h" className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Little reads, big understanding</h2>
          <p className="mt-2 font-hand text-3xl text-ink/80">Know more. Judge less. Include everyone. 💛</p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POSTS.slice(0, 8).map((p, i) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className={`group relative flex h-full flex-col rounded-3xl ${p.tint} p-6 shadow-[0_10px_30px_rgba(60,40,120,0.08)] ring-1 ring-brand-deep/10 transition duration-300 motion-safe:hover:-translate-y-2 motion-safe:hover:rotate-0 hover:shadow-[0_24px_50px_rgba(60,40,120,0.16)] ${TILT[i % TILT.length]}`}
              >
                <span aria-hidden className="absolute -top-5 right-5 grid size-14 place-items-center rounded-2xl bg-white text-3xl shadow-lg ring-1 ring-brand-deep/10 motion-safe:group-hover:animate-float">
                  {p.emoji}
                </span>
                <span className="text-sm font-bold uppercase tracking-wide text-brand">{p.kicker}</span>
                <span className="mt-2 text-xl font-bold leading-snug text-ink">{p.title}</span>
                <span className="mt-2 flex-1 leading-relaxed text-body">{p.teaser}</span>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-brand-deep">
                  Read ({p.read}) <ArrowRight className="size-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center">
          <Link href="/blog" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand-deep shadow-md ring-1 ring-brand-deep/10 hover:bg-brand-soft">
            See all posts <ArrowRight className="size-4" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
}
