import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/landing/site-shell";
import { POSTS, findPost } from "@/data/blogPosts";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = findPost((await params).slug);
  return post ? { title: `${post.kicker} — ILUMO Awareness`, description: post.teaser } : {};
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = findPost((await params).slug);
  if (!post) notFound();
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand underline underline-offset-4">
          <ArrowLeft className="size-4" aria-hidden /> All posts
        </Link>
        <header className={`mt-6 rounded-3xl ${post.tint} p-8 ring-1 ring-brand-deep/10`}>
          <span aria-hidden className="text-5xl">{post.emoji}</span>
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-brand">{post.kicker} · {post.read}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{post.title}</h1>
        </header>

        <p className="mt-8 text-xl leading-relaxed text-ink">{post.intro}</p>
        {post.sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-2xl font-bold text-ink">{s.heading}</h2>
            <p className="mt-2 text-xl leading-relaxed text-body">{s.body}</p>
          </section>
        ))}

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-brand-deep/10">
            <h2 className="text-xl font-bold text-ink">Quick facts</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-lg text-body">{post.facts.map((f) => <li key={f}>{f}</li>)}</ul>
          </section>
          <section className="rounded-3xl bg-white p-6 ring-1 ring-brand-deep/10">
            <h2 className="text-xl font-bold text-ink">How to be a good ally</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-lg text-body">{post.ally.map((f) => <li key={f}>{f}</li>)}</ul>
          </section>
        </div>

        {post.support && (
          <Link href={post.support.href} className="mt-10 inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)]">
            {post.support.label} <ArrowRight className="size-5" aria-hidden />
          </Link>
        )}

        <section aria-labelledby="more" className="mt-16">
          <h2 id="more" className="text-2xl font-bold text-ink">Keep reading</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className={`flex h-full flex-col gap-1 rounded-2xl ${p.tint} p-4 ring-1 ring-brand-deep/10 hover:shadow-lg`}>
                  <span aria-hidden className="text-2xl">{p.emoji}</span>
                  <span className="font-bold text-ink">{p.kicker}</span>
                  <span className="text-sm text-body">{p.read}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </SiteShell>
  );
}
