"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Brain, Eye, Menu as MenuIcon, Mic, Volume2, X } from "lucide-react";
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";
import { Logo } from "./logo";

const sections = ["home", "about", "features", "impact", "contact"] as const;

const links = [
  { label: "Home", href: "/", id: "home" },
  { label: "About", href: "/#about", id: "about" },
  { label: "Features", href: "/#features", id: "features" },
  { label: "Our Impact", href: "/#impact", id: "impact" },
  { label: "For Parents", href: "/parents", id: "parents" },
  { label: "Contact", href: "/#contact", id: "contact" },
];

const supports = [
  { title: "Audio Support", description: "Text-to-speech and audio summaries", icon: <Volume2 className="size-5 text-rose-500" />, bg: "bg-tint-pink" },
  { title: "Visual Support", description: "OCR, alt-text and screen readers", icon: <Eye className="size-5 text-blue-600" />, bg: "bg-tint-blue" },
  { title: "Speech Support", description: "Speech-to-text and AAC", icon: <Mic className="size-5 text-emerald-600" />, bg: "bg-tint-green" },
  { title: "Cognitive Support", description: "Focus mode and simplified content", icon: <Brain className="size-5 text-violet-600" />, bg: "bg-tint-purple" },
];

export function Navbar() {
  const [active, setActive] = useState<string | null>(null);
  const [current, setCurrent] = useState<string>("home");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled ? "bg-canvas/80 shadow-[0_1px_0_rgba(91,77,245,0.08)] backdrop-blur-lg" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden lg:block">
          <Menu setActive={setActive} label="Main">
            {links.map((l) => {
              const isCurrent = current === l.id;
              if (l.id === "features")
                return (
                  <MenuItem key={l.id} item={l.label} href={l.href} current={isCurrent} active={active} setActive={setActive}>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {supports.map((s) => (
                        <ProductItem key={s.title} title={s.title} description={s.description} href="/#features" icon={s.icon} iconBg={s.bg} />
                      ))}
                    </div>
                  </MenuItem>
                );
              if (l.id === "parents")
                return (
                  <MenuItem key={l.id} item={l.label} href={l.href} current={isCurrent} active={active} setActive={setActive}>
                    <div className="flex w-56 flex-col gap-3 p-1 text-sm">
                      <p className="text-body">Follow progress and shape the way your child learns.</p>
                      <HoveredLink href="/parents" className="font-semibold text-brand">
                        Go to parent space →
                      </HoveredLink>
                    </div>
                  </MenuItem>
                );
              return <MenuItem key={l.id} item={l.label} href={l.href} current={isCurrent} active={active} setActive={setActive} />;
            })}
          </Menu>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/#features"
            className="hidden items-center gap-2 rounded-full bg-brand px-6 py-3 text-[15px] font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)] transition hover:bg-[#4a3de0] motion-safe:hover:-translate-y-0.5 sm:inline-flex"
          >
            Get Started <ArrowRight className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white text-ink shadow-md lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mb-3 rounded-3xl border border-white bg-white/95 p-3 shadow-[0_20px_50px_rgba(91,77,245,0.18)] backdrop-blur-lg lg:hidden"
          >
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.id}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={current === l.id ? "page" : undefined}
                    className={`block rounded-2xl px-4 py-3 text-base font-medium ${
                      current === l.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-brand-soft/60"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/#features"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white"
            >
              Get Started <ArrowRight className="size-4" aria-hidden />
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
