"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Check, Eye, EyeOff, GraduationCap, Users } from "lucide-react";
import { ALL_SLUGS, NEEDS, passwordStrength, type Need, type Role } from "@/lib/auth-shared";
import { AnimatedQuestion, Field, Hint, LOGO_COLORS, PrimaryButton } from "./auth-ui";

export type Mode = "login" | "signup";

type FormProps = { onSubmit: (e: React.FormEvent) => void; children: React.ReactNode };
export function StepForm({ onSubmit, children }: FormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-7">
      {children}
    </form>
  );
}

// ---- Email -----------------------------------------------------------------
export function EmailStep(props: {
  mode: Mode;
  value: string;
  error: string | null;
  shake: number;
  taken: boolean;
  checking?: boolean;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { mode } = props;
  return (
    <StepForm onSubmit={props.onSubmit}>
      <div>
        <AnimatedQuestion text={mode === "signup" ? "Hi there! What's your email address?" : "Welcome back! What's your email?"} />
        <Hint>{mode === "signup" ? "We'll use it to set up your ILUMO account." : "Let's find your account."}</Hint>
      </div>
      <Field
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        value={props.value}
        error={props.error}
        shakeKey={props.shake}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.taken && (
        <p className="-mt-3 text-base text-body">
          <Link href="/login" className="font-semibold text-brand underline underline-offset-4">Log in instead</Link>
        </p>
      )}
      <PrimaryButton type="submit" loading={props.checking}>Continue</PrimaryButton>
    </StepForm>
  );
}

// ---- Name ------------------------------------------------------------------
export function NameStep(props: {
  value: string;
  error: string | null;
  shake: number;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <StepForm onSubmit={props.onSubmit}>
      <div>
        <AnimatedQuestion text="Nice to meet you! What should we call you?" />
        <Hint>Just your first name is perfect.</Hint>
      </div>
      <Field
        label="Your name"
        name="name"
        autoComplete="given-name"
        placeholder="e.g. Aarav"
        value={props.value}
        error={props.error}
        shakeKey={props.shake}
        onChange={(e) => props.onChange(e.target.value)}
      />
      <PrimaryButton type="submit">Continue</PrimaryButton>
    </StepForm>
  );
}

// ---- Existing user (login) ---------------------------------------------------
export function ExistsStep(props: { name?: string; email: string; onSubmit: (e: React.FormEvent) => void; onBack: () => void }) {
  const found = !!props.name;
  return (
    <StepForm onSubmit={props.onSubmit}>
      <div>
        <AnimatedQuestion text={found ? `Welcome back, ${props.name}!` : "Hmm, we couldn't find that account."} />
        <Hint>
          {found
            ? "Great to see you again. We found your account."
            : `There's no ILUMO account for ${props.email} yet.`}
        </Hint>
      </div>
      {found ? (
        <PrimaryButton type="submit" data-autofocus>Continue</PrimaryButton>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" data-autofocus className="inline-flex min-h-14 items-center rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(91,77,245,0.35)]">
            Create an account
          </Link>
          <button type="button" onClick={props.onBack} className="min-h-14 rounded-full border-2 border-brand-deep/20 bg-white px-8 text-lg font-semibold text-brand-deep hover:bg-brand-soft">
            Try another email
          </button>
        </div>
      )}
    </StepForm>
  );
}

// ---- Role -----------------------------------------------------------------
const ROLES: { id: Role; title: string; text: string; Icon: typeof Users; bg: string }[] = [
  { id: "student", title: "I'm a Student", text: "I want to learn in a way that works for me.", Icon: GraduationCap, bg: "bg-tint-blue" },
  { id: "parent", title: "I'm a Parent", text: "I'm setting things up for my child.", Icon: Users, bg: "bg-tint-pink" },
];

export function RoleStep(props: {
  name: string;
  value: Role | null;
  error: string | null;
  shake: number;
  onChange: (r: Role) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const reduced = useReducedMotion();
  const first = props.name.trim().split(" ")[0];
  return (
    <StepForm onSubmit={props.onSubmit}>
      <div>
        <AnimatedQuestion text={first ? `Great, ${first}! Are you a student or a parent?` : "Are you a student or a parent?"} />
        <Hint>This helps us set up the right experience.</Hint>
      </div>
      <fieldset>
        <legend className="sr-only">Choose your role</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map(({ id, title, text, Icon, bg }, i) => {
            const selected = props.value === id;
            return (
              <motion.label
                key={id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0 : 0.25 + i * 0.1 }}
                whileHover={reduced ? undefined : { y: -4, rotate: i ? 0.6 : -0.6 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex cursor-pointer flex-col gap-3 rounded-3xl p-5 text-ink transition-shadow has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-brand ${bg} ${
                  selected ? "shadow-[0_0_0_4px_var(--color-brand)]" : "ring-2 ring-brand-deep/10 hover:shadow-lg"
                }`}
              >
                <input type="radio" name="role" value={id} checked={selected} onChange={() => props.onChange(id)} className="sr-only" />
                <span className="grid size-12 place-items-center rounded-full bg-white text-brand shadow-sm">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="text-xl font-bold">{title}</span>
                <span className="text-base text-body">{text}</span>
                {selected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-brand text-white"
                  >
                    <Check className="size-4" aria-hidden />
                    <span className="sr-only">Selected</span>
                  </motion.span>
                )}
              </motion.label>
            );
          })}
        </div>
      </fieldset>
      <div aria-live="assertive">
        {props.error && <p key={props.shake} className="text-base font-semibold text-rose-700">⚠ {props.error}</p>}
      </div>
      <PrimaryButton type="submit">Continue</PrimaryButton>
    </StepForm>
  );
}

// ---- Password ----------------------------------------------------------------
const STRENGTH = ["Too short", "Weak", "Okay", "Good", "Strong"];

export function PasswordStep(props: {
  mode: Mode;
  value: string;
  error: string | null;
  shake: number;
  loading: boolean;
  isFinal: boolean;
  formError?: string | null;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [show, setShow] = useState(false);
  const { score, rules } = passwordStrength(props.value);
  const signup = props.mode === "signup";
  return (
    <StepForm onSubmit={props.onSubmit}>
      <div>
        <AnimatedQuestion text={signup ? "Let's keep your account safe. Create a password." : "Almost there. Enter your password."} />
        <Hint>{signup ? "Choose something only you would know." : "Use the password you created when you signed up."}</Hint>
      </div>
      <Field
        label="Password"
        name="password"
        type={show ? "text" : "password"}
        autoComplete={signup ? "new-password" : "current-password"}
        value={props.value}
        error={props.error}
        shakeKey={props.shake}
        onChange={(e) => props.onChange(e.target.value)}
        trailing={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            className="grid size-11 place-items-center rounded-full text-brand-deep hover:bg-brand-soft"
          >
            {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
            <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
          </button>
        }
      />
      {signup && (
        <div>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-brand-deep/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: LOGO_COLORS[i + 1] }}
                  initial={false}
                  animate={{ width: props.value && i < score ? "100%" : "0%" }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold text-body" aria-live="polite">
            Strength: {props.value ? STRENGTH[score] : "not started"}
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm text-body sm:grid-cols-2">
            {rules.map((r) => (
              <li key={r.label} className="flex items-center gap-2">
                <span aria-hidden className={`grid size-5 place-items-center rounded-full text-[11px] ${r.ok ? "bg-brand text-white" : "ring-2 ring-brand-deep/25"}`}>
                  {r.ok && <Check className="size-3" />}
                </span>
                {r.label}
                <span className="sr-only">{r.ok ? "(done)" : "(not yet)"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {props.formError && (
        <p role="alert" className="rounded-2xl bg-tint-pink p-4 font-semibold text-ink ring-1 ring-black/20">{props.formError}</p>
      )}
      <PrimaryButton type="submit" loading={props.loading}>
        {signup ? "Create my account" : "Log in"}
      </PrimaryButton>
    </StepForm>
  );
}


// ---- Support picker (shared by the student survey and the parent's child profile) ---
export function SupportPicker(props: { value: Need[]; onChange: (v: Need[]) => void; legend: string }) {
  const { value } = props;
  const toggle = (id: Need) => props.onChange(value.includes(id) ? value.filter((n) => n !== id) : [...value, id]);
  const notSure = value.length === ALL_SLUGS.length;
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-brand-deep">{props.legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {NEEDS.map((n) => {
          const on = value.includes(n.id);
          return (
            <motion.label
              key={n.id}
              whileTap={{ scale: 0.98 }}
              className={`relative flex min-h-16 cursor-pointer flex-col gap-0.5 rounded-2xl p-4 pr-11 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                on ? "bg-brand-soft ring-4 ring-brand" : "bg-white ring-2 ring-brand-deep/15 hover:bg-brand-soft/60"
              }`}
            >
              <input type="checkbox" checked={on} onChange={() => toggle(n.id)} className="sr-only" />
              <span className="font-bold text-ink">{n.label}</span>
              <span className="text-sm text-body">{n.summary}</span>
              <span aria-hidden className={`absolute right-3 top-3 grid size-6 place-items-center rounded-full ${on ? "bg-brand text-white" : "ring-2 ring-brand-deep/30"}`}>
                {on && <Check className="size-4" />}
              </span>
            </motion.label>
          );
        })}
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        aria-pressed={notSure}
        onClick={() => props.onChange(notSure ? [] : [...ALL_SLUGS])}
        className={`mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-base font-semibold ${notSure ? "bg-brand-deep text-white" : "bg-white text-brand-deep ring-2 ring-brand-deep/20 hover:bg-brand-soft"}`}
      >
        {notSure && <Check className="size-4" aria-hidden />} I&apos;m not sure yet. Show me everything.
      </motion.button>
    </fieldset>
  );
}

// ---- Survey (students) ----------------------------------------------------------
export function SurveyStep(props: {
  name: string;
  value: Need[];
  error: string | null;
  shake: number;
  loading: boolean;
  isFinal: boolean;
  mode: Mode;
  formError?: string | null;
  onChange: (v: Need[]) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const first = props.name.trim().split(" ")[0];
  return (
    <StepForm onSubmit={props.onSubmit}>
      <div>
        <AnimatedQuestion text={first ? `${first}, what kind of support helps you most?` : "What kind of support helps you most?"} />
        <Hint>Choose all that apply. ILUMO will only show the tools that fit you. You can change this any time in Settings.</Hint>
      </div>
      <SupportPicker value={props.value} onChange={props.onChange} legend="I would like support with" />
      <div aria-live="assertive">
        {props.error && <p key={props.shake} className="text-base font-semibold text-rose-700">⚠ {props.error}</p>}
        {props.formError && <p role="alert" className="rounded-2xl bg-tint-pink p-4 font-semibold text-ink ring-1 ring-black/20">{props.formError}</p>}
      </div>
      <PrimaryButton type="submit" loading={props.loading}>
        {props.isFinal ? (props.mode === "signup" ? "Create my account" : "Finish") : "Continue"}
      </PrimaryButton>
    </StepForm>
  );
}

// ---- Complete ----------------------------------------------------------------
export function CompleteStep(props: { mode: Mode; name: string; role: Role; href: string }) {
  const reduced = useReducedMotion();
  const first = props.name.split(" ")[0];
  const student = props.role === "student";
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-6 grid size-28 place-items-center">
        {!reduced &&
          LOGO_COLORS.concat(LOGO_COLORS).map((color, i) => {
            const angle = (i / 10) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                aria-hidden
                className="absolute size-3 rounded-full"
                style={{ background: color }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: Math.cos(angle) * 84, y: Math.sin(angle) * 84, scale: [0, 1.2, 0], opacity: [1, 1, 0] }}
                transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
              />
            );
          })}
        <motion.div
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="grid size-24 place-items-center rounded-full bg-brand text-white shadow-[0_16px_40px_rgba(91,77,245,0.4)]"
        >
          <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5 }} />
          </svg>
        </motion.div>
      </div>
      <AnimatedQuestion text={props.mode === "signup" ? `You're all set, ${first}!` : `Welcome back, ${first}!`} />
      <Hint delay={0.6}>
        {student
          ? "Your learning space is ready. Let's turn your first lesson into something accessible."
          : "Your dashboard is ready. Add your child to create their account and follow their learning."}
      </Hint>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={props.href} data-autofocus className="group inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(91,77,245,0.35)] transition hover:bg-[#4a3de0] motion-safe:hover:-translate-y-0.5">
          {student ? "Start learning" : "Go to my dashboard"}
          <Image src="/images/ilumo-star.png" alt="" width={24} height={24} className="size-6" />
        </Link>
        <Link href="/" className="inline-flex min-h-14 items-center rounded-full border-2 border-brand-deep/20 bg-white px-8 text-lg font-semibold text-brand-deep hover:bg-brand-soft">
          Back to home
        </Link>
      </div>
      <p className="mt-6 text-sm text-body">Your account is saved securely, so you can pick up where you left off.</p>
    </div>
  );
}
