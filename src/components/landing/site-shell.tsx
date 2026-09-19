import { Navbar } from "./navbar";
import { Footer } from "./footer";

/** Navigation + footer for the public pages (About, Impact, Blog, Contact). */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mx-auto max-w-4xl px-4 pb-8 pt-10 text-center sm:px-6 sm:pt-16">
      <p className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1>
      {children && <p className="mx-auto mt-4 max-w-2xl text-xl leading-relaxed text-body">{children}</p>}
    </header>
  );
}
