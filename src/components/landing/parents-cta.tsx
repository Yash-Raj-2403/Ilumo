"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";
import { useAuthSession } from "@/lib/session/use-session";
import { useMyProfile } from "@/lib/session/use-supports";

const primary = "inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand-deep px-8 text-lg font-semibold text-white hover:bg-[#1a1450]";
const secondary = "inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-lg font-semibold text-brand-deep ring-2 ring-brand-deep/60 hover:bg-brand-soft";

/** The button area on the For Parents page: what to do depends on who is signed in. */
export function ParentsCta() {
  const router = useRouter();
  const { signedIn, signOut } = useAuthSession();
  const { role } = useMyProfile();

  if (signedIn === null || (signedIn && role === null)) {
    return <p role="status" className="text-lg text-body">One moment...</p>;
  }

  if (!signedIn) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link href="/signup?role=parent" className={primary}>Sign up as a parent <ArrowRight className="size-5" aria-hidden /></Link>
        <Link href="/login" className={secondary}>I already have a parent account</Link>
      </div>
    );
  }

  if (role === "parent") {
    return (
      <div className="flex flex-wrap gap-3">
        <Link href="/parent" className={primary}>Open my parent dashboard <ArrowRight className="size-5" aria-hidden /></Link>
      </div>
    );
  }

  // A student is signed in: the parent area belongs to a parent account, so say so plainly instead of redirecting.
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-tint-yellow p-4 text-lg font-semibold text-ink ring-1 ring-black/10">
        You are signed in as a student, and the parent space is only for parent accounts. A parent can sign up on their own device. Or sign out here to make a parent account.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/student" className={primary}>Back to my learning space</Link>
        <button
          type="button"
          onClick={async () => { await signOut(); router.push("/signup?role=parent"); }}
          className={secondary}
        >
          <LogOut className="size-5" aria-hidden /> Sign out and sign up as a parent
        </button>
      </div>
    </div>
  );
}
