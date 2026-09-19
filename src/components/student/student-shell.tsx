"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, LineChart, LogOut, Plus, Settings, X } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { AccessibilityToolbar } from "./accessibility-toolbar";
import { useStudent } from "./student-provider";

const STUDENT_NAV = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/lessons", label: "My Lessons", icon: BookOpen },
  { href: "/student/new", label: "New Material", icon: Plus },
  { href: "/student/progress", label: "Progress", icon: LineChart },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

const PARENT_NAV = [
  { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, updateSettings, user, signOut, dbError } = useStudent();
  const router = useRouter();
  const parent = user.role === "parent";
  const NAV = parent ? PARENT_NAV : STUDENT_NAV;
  // Each role has its own area; settings are shared.
  const wrongArea = parent
    ? pathname.startsWith("/student") && !pathname.startsWith("/student/settings")
    : pathname.startsWith("/parent");
  useEffect(() => {
    if (wrongArea) router.replace(parent ? "/parent" : "/student");
  }, [wrongArea, parent, router]);
  const isCurrent = (href: string) => (href === "/student" ? pathname === href : pathname.startsWith(href));
  const focus = !parent && settings.focusMode && pathname.startsWith("/student/lesson/");
  if (wrongArea) return <div role="status" className="grid min-h-screen flex-1 place-items-center text-lg font-semibold text-brand-deep">Loading...</div>;

  if (focus) {
    return (
      <div className="flex min-h-screen flex-1 flex-col bg-canvas">
        <div className="flex items-center justify-between gap-3 border-b-2 border-brand-deep/10 px-4 py-3 sm:px-8">
          <p className="font-bold text-brand-deep">Focus Mode</p>
          <div className="flex gap-2">
            <Link href="/student/lessons" className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold text-brand-deep card-border">
              Back to lessons
            </Link>
            <button
              type="button"
              onClick={() => updateSettings({ focusMode: false })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-deep px-4 font-semibold text-white"
            >
              <X className="size-4" aria-hidden /> Exit Focus Mode
            </button>
          </div>
        </div>
        <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-8">
          {children}
        </main>
        <AccessibilityToolbar />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(60%_50%_at_85%_0%,#ece8fb_0%,transparent_70%),radial-gradient(40%_40%_at_0%_10%,#fff1e6_0%,transparent_70%)]">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="hidden shrink-0 md:sticky md:top-[5.75rem] md:flex md:h-[calc(100vh-5.75rem)] md:w-20 md:flex-col lg:w-64">
          <nav aria-label="Student" className="flex flex-1 flex-col gap-1 px-3 pt-4">
            {NAV.map(({ href, label, icon: Icon }) => {
              const current = isCurrent(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  title={label}
                  className={`flex min-h-12 items-center gap-3 rounded-full px-4 font-semibold transition md:justify-center lg:justify-start ${
                    current ? "bg-brand-soft text-brand ring-1 ring-brand/15" : "text-ink hover:bg-brand-soft/60"
                  }`}
                >
                  <Icon className="size-6 shrink-0" aria-hidden />
                  <span className="md:sr-only lg:not-sr-only">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3">
            <p className="mb-2 hidden truncate px-4 text-sm text-body lg:block" title={user.email}>{user.name}<br /><span className="text-xs">{user.email}</span></p>
            <button
              type="button"
              onClick={signOut}
              className="flex min-h-12 w-full items-center gap-3 rounded-full px-4 font-semibold text-ink hover:bg-brand-soft/60 md:justify-center lg:justify-start"
            >
              <LogOut className="size-6 shrink-0" aria-hidden />
              <span className="md:sr-only lg:not-sr-only">Sign out</span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {dbError && (
            <p role="alert" className="mx-4 mt-4 rounded-2xl bg-tint-yellow px-4 py-3 text-center font-semibold text-ink sm:mx-8">{dbError}</p>
          )}
          <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-8 sm:px-8 md:pb-16">
            {children}
          </main>
        </div>
      </div>

      <nav
        aria-label="Student"
        style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}
        className="fixed inset-x-0 bottom-0 z-30 grid rounded-t-3xl border-t border-brand-deep/10 bg-white/95 shadow-[0_-8px_30px_rgba(60,40,120,0.08)] backdrop-blur md:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${
                current ? "bg-brand-soft font-bold text-brand" : "text-ink"
              }`}
            >
              <Icon className="size-6" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <AccessibilityToolbar />
    </div>
  );
}
