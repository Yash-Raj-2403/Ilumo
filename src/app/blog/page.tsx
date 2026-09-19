import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, SiteShell } from "@/components/landing/site-shell";
import { POSTS } from "@/data/blogPosts";

export const metadata: Metadata = { title: "Awareness — ILUMO", description: "Short, friendly reads about autism, ADHD, dyslexia and other disabilities." };

export default function BlogIndex() {
  return (
    <SiteShell>
      <PageHeader eyebrow="AWARENESS CORNER" title="Little reads, big understanding">
        Short, friendly posts about how different minds and bodies experience learning, and what helps.
      </PageHeader>
      <ul className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className={`group flex h-full flex-col gap-2 rounded-3xl ${p.tint} p-6 ring-1 ring-brand-deep/10 transition motion-safe:hover:-translate-y-1 hover:shadow-xl`}>
              <span aria-hidden className="text-4xl">{p.emoji}</span>
              <span className="text-sm font-bold uppercase tracking-wide text-brand">{p.kicker}</span>
              <span className="text-xl font-bold leading-snug text-ink">{p.title}</span>
              <span className="flex-1 text-body">{p.teaser}</span>
              <span className="mt-3 inline-flex items-center gap-2 font-semibold text-brand-deep">{p.read} <ArrowRight className="size-4" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </SiteShell>
  );
}
