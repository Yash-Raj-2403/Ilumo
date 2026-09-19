"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Accessibility, ArrowRight, BookOpen, Ear, Eye, LayoutDashboard, LogOut, Menu as MenuIcon, MessageCircle, Puzzle, X } from "lucide-react";
import { useAuthSession } from "@/lib/supabase/use-session";
import { useMyProfile } from "@/lib/supabase/use-supports";
import { CATEGORIES, categoryHref } from "@/lib/categories";
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";
import { Logo } from "./logo";

// Only these two live on the landing page and are tracked while scrolling; the rest are pages.
const sections = ["home", "features", "awareness"] as const;

const links = [
  { label: "Home", href: "/", id: "home" },
  { label: "About", href: "/about", id: "about" },
  { label: "Features", href: "/#features", id: "features" },
  { label: "Our Impact", href: "/impact", id: "impact" },
  { label: "Awareness", href: "/blog", id: "blog" },
  { label: "For Parents", href: "/parents", id: "parents" },
  { label: "Contact", href: "/contact", id: "contact" },
];

const ICON_BY_SLUG = {
  autism: { icon: <Puzzle className="size-5 text-amber-600" />, bg: "bg-tint-yellow" },
  "blind-low-vision": { icon: <Eye className="size-5 text-blue-600" />, bg: "bg-tint-blue" },
  "deaf-hoh": { icon: <Ear className="size-5 text-rose-500" />, bg: "bg-tint-pink" },
  speech: { icon: <MessageCircle className="size-5 text-emerald-600" />, bg: "bg-tint-green" },
  motor: { icon: <Accessibility className="size-5 text-violet-600" />, bg: "bg-tint-purple" },
  learning: { icon: <BookOpen className="size-5 text-sky-600" />, bg: "bg-tint-blue" },
} as const;

const allSupports = CATEGORIES.map((c) => ({
  slug: c.slug,
  title: c.title,
  description: c.ready ? c.summary : "Coming soon",
  href: c.ready ? categoryHref(c) : "/#features",
  ...ICON_BY_SLUG[c.slug],
}));

export function Navbar() {
  const [active, setActive] = useState<string | null>(null);
  const [landingCurrent, setCurrent] = useState<string>("home");
  const pathname = usePathname();
  // On the landing page the highlight follows scrolling; inside the student area no section is "current".
  const inApp = pathname.startsWith("/student") || pathname.startsWith("/parent");
  const current =
    pathname === "/" ? (landingCurrent === "awareness" ? "blog" : landingCurrent)
    : pathname.startsWith("/about") ? "about"
    : pathname.startsWith("/impact") ? "impact"
    : pathname.startsWith("/blog") ? "blog"
    : pathname.startsWith("/contact") ? "contact"
    : pathname.startsWith("/parents") || pathname === "/parent" || pathname.startsWith("/parent/") ? "parents"
    : pathname.startsWith("/student/support") ? "features"
    : null;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { signedIn, signOut } = useAuthSession();
  const { role, supports: mine } = useMyProfile();
  const dashboardHref = role === "parent" ? "/parent" : "/student";
  // Inside the app, "Features" goes to the learner's own support list, not back to the landing page.
  const navLinks = links.map((l) =>
    l.id === "features" && inApp ? { ...l, href: role === "parent" ? "/parent" : "/student#support" }
    : l.id === "parents" && role === "parent" ? { ...l, href: "/parent" } // a parent goes straight to their dashboard
    : l,
  );
  const supports = mine === undefined ? [] : mine ? allSupports.filter((s) => mine.includes(s.slug)) : allSupports;
  const logOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
  };

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
            {navLinks.map((l) => {
              const isCurrent = current === l.id;
              if (l.id === "features")
                return (
                  <MenuItem key={l.id} item={l.label} href={l.href} current={isCurrent} active={active} setActive={setActive}>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {supports.map((s) => (
                        <ProductItem key={s.title} title={s.title} description={s.description} href={s.href} icon={s.icon} iconBg={s.bg} />
                      ))}
                    </div>
                  </MenuItem>
                );
              if (l.id === "parents")
                return (
                  <MenuItem key={l.id} item={l.label} href={l.href} current={isCurrent} active={active} setActive={setActive}>
                    <div className="flex w-56 flex-col gap-3 p-1 text-sm">
                      <p className="text-body">Follow progress and shape the way your child learns.</p>
                      <HoveredLink href={l.href} className="font-semibold text-brand">
                        {role === "parent" ? "Open my parent dashboard →" : "Go to parent space →"}
                      </HoveredLink>
                    </div>
                  </MenuItem>
                );
              return <MenuItem key={l.id} item={l.label} href={l.href} current={isCurrent} active={active} setActive={setActive} />;
            })}
          </Menu>
        </div>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <button
                type="button"
                onClick={logOut}
                className="hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-3 text-[15px] font-semibold text-brand-deep transition hover:bg-brand-soft sm:inline-flex xl:px-4"
              >
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
              <Link
                href={dashboardHref}
                className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-brand px-5 py-3 text-[15px] font-semibold xl:px-6 text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)] transition hover:bg-[#4a3de0] motion-safe:hover:-translate-y-0.5 sm:inline-flex"
              >
                <LayoutDashboard className="size-4" aria-hidden /> Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-3 text-[15px] font-semibold text-brand-deep transition hover:bg-brand-soft sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-brand px-5 py-3 text-[15px] font-semibold xl:px-6 text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)] transition hover:bg-[#4a3de0] motion-safe:hover:-translate-y-0.5 sm:inline-flex"
              >
                Get Started <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          )}
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
              {navLinks.map((l) => (
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
            {signedIn ? (
              <>
                <button
                  type="button"
                  onClick={logOut}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-deep/20 px-6 py-3 font-semibold text-brand-deep"
                >
                  <LogOut className="size-4" aria-hidden /> Sign out
                </button>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white"
                >
                  <LayoutDashboard className="size-4" aria-hidden /> Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-full border-2 border-brand-deep/20 px-6 py-3 font-semibold text-brand-deep"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white"
                >
                  Get Started <ArrowRight className="size-4" aria-hidden />
                </Link>
              </>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
