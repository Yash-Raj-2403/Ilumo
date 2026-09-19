"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { normalizeSupports, safeNext, validateEmail, validateLoginPassword, validateName, validateNewPassword, type Need, type Role } from "@/lib/auth-shared";
import { supabase } from "@/lib/supabase/client";
import { loadProfile, saveSettings } from "@/lib/supabase/data";
import { LOGO_COLORS } from "./auth-ui";
import {
  CompleteStep, EmailStep, ExistsStep, NameStep, PasswordStep, RoleStep, SurveyStep,
  type Mode,
} from "./auth-steps";

type StepId = "email" | "name" | "exists" | "role" | "survey" | "password" | "complete";

// New students answer a short survey about the support they need (at signup, or at their first login
// if they skipped it). Logging in never asks "student or parent": the account already knows.
const stepsFor = (mode: Mode, role: Role | null, loginSurvey: boolean): StepId[] => {
  if (mode === "signup") {
    return ["email", "name", "role", ...(role === "student" ? (["survey"] as StepId[]) : []), "password", "complete"];
  }
  return ["email", "exists", "password", ...(role === "student" && loginSurvey ? (["survey"] as StepId[]) : []), "complete"];
};

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
};

export function AuthFlow({ mode }: { mode: Mode }) {
  const reduced = useReducedMotion();
  const query = useSearchParams();
  const next = safeNext(query.get("next"));
  const roleParam = query.get("role");
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | null>(roleParam === "parent" || roleParam === "student" ? roleParam : null);
  const [password, setPassword] = useState(""); // memory only, wiped on completion
  const [existing, setExisting] = useState<{ name: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [supports, setSupports] = useState<Need[]>([]);
  const [loginSurvey, setLoginSurvey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [shake, setShake] = useState(0);
  const [taken, setTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const steps = stepsFor(mode, role, loginSurvey);
  const step = steps[idx];
  const total = steps.length - 1; // "complete" isn't counted as a question
  const done = step === "complete";
  const displayName = mode === "login" ? existing?.name ?? "" : name;

  const fail = (e: Record<string, string | undefined>) => {
    setErrors(e);
    setShake((s) => s + 1);
  };
  const go = (delta: 1 | -1) => {
    setErrors({});
    setFormError(null);
    setDir(delta);
    setIdx((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  };

  const isFinal = (s: StepId) => steps[steps.indexOf(s) + 1] === "complete";

  /** Signup: create the account on the server, then sign in with the same password. */
  async function createAccount() {
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name.trim(), password, role, supports }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "We couldn't create your account right now.");
        if (res.status === 409) setTaken(true);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) {
        setFormError("Your account was created, but we couldn't log you in. Please try logging in.");
        return;
      }
      setPassword("");
      go(1);
    } catch {
      setFormError("We couldn't connect. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  /** Login: check the password, then read the role (student or parent) from the account itself. */
  async function signIn() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error || !data.user) {
        const network = error && /fetch|network/i.test(error.message);
        return fail({ password: network ? "We couldn't connect. Check your internet and try again." : "That email and password don't match." });
      }
      const profile = await loadProfile(data.user.id).catch(() => null);
      const actual: Role = profile?.role ?? "student";
      setRole(actual);
      if (profile) setExisting({ name: profile.name });
      setPassword("");
      if (actual === "student") {
        const saved = normalizeSupports((profile?.settings as { supports?: unknown } | null)?.supports);
        if (saved.length === 0) setLoginSurvey(true); // never asked: ask now
        setSupports(saved);
      }
      go(1);
    } finally {
      setLoading(false);
    }
  }

  /** Save the chosen support categories into the profile's settings without touching other settings. */
  async function mergeSupports(userId: string, list: Need[]) {
    const profile = await loadProfile(userId);
    const current = profile?.settings && typeof profile.settings === "object" ? profile.settings : {};
    await saveSettings(userId, { ...current, supports: list });
  }

  /** Login (students): save the survey answers, then finish. */
  async function saveSurvey() {
    setLoading(true);
    setFormError(null);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) await mergeSupports(data.user.id, supports);
      go(1);
    } catch {
      setFormError("We couldn't save that just now, but you're logged in. You can change it in Settings.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || checking) return;
    switch (step) {
      case "email": {
        const err = validateEmail(email);
        if (err) return fail({ email: err });
        setChecking(true);
        try {
          const res = await fetch("/api/auth/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return fail({ email: data.error ?? "Something went wrong. Please try again." });
          if (mode === "signup" && data.exists) {
            setTaken(true);
            return fail({ email: "That email already has an ILUMO account." });
          }
          setTaken(false);
          setExisting(data.exists ? { name: data.name } : null);
          return go(1);
        } catch {
          return fail({ email: "We couldn't connect. Check your internet and try again." });
        } finally {
          setChecking(false);
        }
      }
      case "name": {
        const err = validateName(name);
        return err ? fail({ name: err }) : go(1);
      }
      case "exists":
        return existing ? go(1) : undefined;
      case "role":
        return role ? go(1) : fail({ role: "Please choose one to continue." });
      case "survey": {
        if (supports.length === 0) return fail({ survey: "Please choose at least one, or tap \"I'm not sure yet\"." });
        return mode === "signup" ? go(1) : saveSurvey();
      }
      case "password": {
        const err = mode === "signup" ? validateNewPassword(password) : validateLoginPassword(password);
        if (err) return fail({ password: err });
        return mode === "login" ? signIn() : createAccount();
      }
    }
  }

  // After a step slides in, move keyboard focus to its first field.
  const focusStep = () => {
    const root = stepRef.current;
    const el =
      root?.querySelector<HTMLElement>("input[type=radio]:checked") ??
      root?.querySelector<HTMLElement>("input:not([type=radio]):not([type=checkbox]), input[type=radio], [data-autofocus]");
    el?.focus({ preventScroll: true });
  };

  // Someone who is already signed in has no reason to be here: send them on. Checked once on
  // arrival only, so it can't cut the completion screen short after signing up.
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const p = await loadProfile(data.session.user.id).catch(() => null);
      router.replace(p?.role === "parent" ? "/parent" : (next ?? "/student"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The first step doesn't animate in, so onAnimationComplete never fires for it.
  useEffect(() => {
    if (idx !== 0) return;
    const t = setTimeout(focusStep, 350);
    return () => clearTimeout(t);
  }, [idx]);

  const pct = done ? 100 : Math.round(((idx + 1) / total) * 100);
  const otherLink = mode === "signup" ? { text: "Already have an account?", label: "Log in", href: "/login" + (next ? `?next=${encodeURIComponent(next)}` : "") } : { text: "New to ILUMO?", label: "Sign up", href: "/signup" + (next ? `?next=${encodeURIComponent(next)}` : "") };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#ece8fb] via-[#fdeef3] to-[#fff4d6]">
      {/* soft drifting colour, same palette as the logo */}
      {!reduced &&
        [
          { c: "#8577d4", cls: "-left-24 top-10 size-72", d: 18 },
          { c: "#fd806c", cls: "-right-20 bottom-10 size-80", d: 22 },
          { c: "#ffb434", cls: "right-1/3 -top-24 size-64", d: 26 },
        ].map((b, i) => (
          <motion.div
            key={i}
            aria-hidden
            className={`pointer-events-none absolute rounded-full opacity-20 blur-3xl ${b.cls}`}
            style={{ background: b.c }}
            animate={{ x: [0, 40, -20, 0], y: [0, -30, 30, 0] }}
            transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Logo />
        <p className="text-base text-body">
          <span className="hidden sm:inline">{otherLink.text} </span>
          <Link href={otherLink.href} className="font-semibold text-brand underline underline-offset-4">
            {otherLink.label}
          </Link>
        </p>
      </header>

      <main id="main" className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-8">
        <div className="w-full max-w-xl">
          <motion.div
            key={step}
            initial={reduced ? false : { scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: done && !reduced ? [0, -10, 10, -6, 0] : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, rotate: { duration: 0.7 } }}
            className="relative z-20 mx-auto -mb-6 w-fit"
          >
            <Image src="/images/ilumo-star.png" alt="" width={256} height={256} priority className="size-24 motion-safe:animate-float" />
          </motion.div>

          <div className="rounded-[2rem] bg-white/90 p-6 pt-10 shadow-[0_30px_80px_rgba(60,40,120,0.16)] ring-1 ring-brand-deep/10 backdrop-blur sm:p-10 sm:pt-12">
            {!done && (
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-body">
                  {idx > 0 ? (
                    <motion.button
                      initial={reduced ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      type="button"
                      onClick={() => go(-1)}
                      className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-brand-deep hover:bg-brand-soft"
                    >
                      <ArrowLeft className="size-4" aria-hidden /> Back
                    </motion.button>
                  ) : (
                    <span />
                  )}
                  <span>Step {idx + 1} of {total}</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={mode === "signup" ? "Sign up progress" : "Log in progress"}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-valuetext={`Step ${idx + 1} of ${total}`}
                  className="h-3 overflow-hidden rounded-full bg-brand-deep/10"
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${LOGO_COLORS.join(", ")})` }}
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            )}

            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                ref={stepRef}
                custom={dir}
                variants={reduced ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } } : slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduced ? 0.01 : 0.32, ease: "easeOut" }}
                onAnimationComplete={(def) => def === "center" && focusStep()}
              >
                {step === "email" && (
                  <EmailStep mode={mode} value={email} error={errors.email ?? null} shake={shake} taken={taken} checking={checking} onChange={(v) => { setEmail(v); setErrors({}); }} onSubmit={submit} />
                )}
                {step === "name" && (
                  <NameStep value={name} error={errors.name ?? null} shake={shake} onChange={(v) => { setName(v); setErrors({}); }} onSubmit={submit} />
                )}
                {step === "exists" && <ExistsStep name={existing?.name} email={email} onSubmit={submit} onBack={() => go(-1)} />}
                {step === "role" && (
                  <RoleStep name={displayName} value={role} error={errors.role ?? null} shake={shake} onChange={(r) => { setRole(r); setErrors({}); }} onSubmit={submit} />
                )}
                {step === "survey" && (
                  <SurveyStep name={displayName || name} mode={mode} value={supports} error={errors.survey ?? null} shake={shake} loading={loading} formError={formError} isFinal={isFinal("survey")} onChange={(v) => { setSupports(v); setErrors({}); }} onSubmit={submit} />
                )}
                {step === "password" && (
                  <PasswordStep mode={mode} value={password} error={errors.password ?? null} shake={shake} loading={loading} formError={formError} isFinal={isFinal("password")} onChange={(v) => { setPassword(v); setErrors({}); }} onSubmit={submit} />
                )}
                {step === "complete" && (
                  <CompleteStep mode={mode} name={displayName || name || "friend"} role={role ?? "student"} href={role === "parent" ? "/parent" : (next ?? "/student")} />
                )}
              </motion.div>
            </AnimatePresence>
            <p className="sr-only" aria-live="polite">{done ? "All done." : `Step ${idx + 1} of ${total}.`}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
