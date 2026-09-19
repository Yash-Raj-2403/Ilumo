"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AccessibilityControls } from "@/components/student/accessibility-controls";
import { Field } from "@/components/auth/auth-ui";
import { SupportPicker } from "@/components/auth/auth-steps";
import { useStudent } from "@/components/student/student-provider";
import { CATEGORIES } from "@/lib/categories";
import { validateEmail, validateName, validateNewPassword, type Need } from "@/lib/auth-shared";
import { authedFetch } from "@/lib/supabase/authed-fetch";
import { supabase } from "@/lib/supabase/client";
import { updateChild, updateName } from "@/lib/supabase/data";

type Status = { kind: "ok" | "error"; text: string } | null;

// Each settings group has its own soft colour, so children can tell them apart.
const TINT: Record<string, string> = { profile: "bg-tint-blue", support: "bg-tint-purple", explore: "bg-tint-yellow", password: "bg-tint-pink", display: "bg-tint-green" };

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`scroll-mt-28 space-y-5 rounded-3xl ${TINT[id] ?? "bg-white"} p-6 card-border sm:p-8`}>
      <div>
        <h2 id={`${id}-h`} className="text-2xl font-bold text-ink">{title}</h2>
        {intro && <p className="mt-1 text-lg text-body">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function StatusLine({ status }: { status: Status }) {
  return (
    <div aria-live="polite">
      {status && (
        <p role={status.kind === "error" ? "alert" : "status"} className={`flex items-center gap-2 rounded-2xl p-3 font-semibold ${status.kind === "ok" ? "bg-tint-green text-ink ring-1 ring-black/15" : "bg-tint-pink text-ink ring-1 ring-black/20"}`}>
          {status.kind === "ok" ? <Check className="size-5" aria-hidden /> : <span aria-hidden>⚠</span>} {status.text}
        </p>
      )}
    </div>
  );
}

const saveBtn = "inline-flex min-h-12 items-center rounded-full bg-brand px-8 font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.3)] disabled:opacity-60";

function ProfileSection() {
  const { user, updateUser } = useStudent();
  const parent = user.role === "parent";
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [status, setStatus] = useState<Status>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs = { name: validateName(name) ?? undefined, email: validateEmail(email) ?? undefined };
    setErrors(errs);
    setStatus(null);
    if (errs.name || errs.email) return;
    setBusy(true);
    try {
      if (name.trim() !== user.name) {
        await updateName(user.id, name.trim());
        updateUser({ name: name.trim() });
      }
      if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
        const res = await authedFetch("/api/auth/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "We couldn't change your email right now.");
        await supabase.auth.refreshSession();
        updateUser({ email: email.trim().toLowerCase() });
      }
      setStatus({ kind: "ok", text: "Your details are saved." });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "We couldn't save that. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section id="profile" title="Personal details">
      <form onSubmit={save} noValidate className="space-y-5">
        <Field label="Name" name="name" autoComplete="given-name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" name="email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
        <p className="text-base text-body">Account type: <strong className="text-ink">{parent ? "Parent" : "Student"}</strong> (this can&apos;t be changed).</p>
        <StatusLine status={status} />
        <button type="submit" disabled={busy} className={saveBtn}>{busy ? "Saving..." : "Save details"}</button>
      </form>
    </Section>
  );
}

function SupportSection() {
  const { user, updateUser, settings, updateSettings } = useStudent();
  const parent = user.role === "parent";
  const chosen = settings.supports ?? [];
  const [editing, setEditing] = useState(chosen.length === 0);
  const [picked, setPicked] = useState<Need[]>(chosen);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (picked.length === 0) return setStatus({ kind: "error", text: "Please choose at least one, or tap \"I'm not sure yet\"." });
    setBusy(true);
    try {
      updateSettings({ supports: picked }); // saved to the account by the settings sync
      if (parent && user.child) {
        await updateChild(user.id, { ...user.child, needs: picked });
        updateUser({ child: { ...user.child, needs: picked } });
      }
      setEditing(false);
      setStatus({ kind: "ok", text: "Saved. ILUMO will only show the support that fits." });
    } catch {
      setStatus({ kind: "error", text: "We couldn't save that. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section id="support" title={parent ? "Your child's support needs" : "The support I need"} intro="ILUMO only shows the support you chose. Everything else stays hidden.">
      {editing ? (
        <form onSubmit={save} className="space-y-5">
          <SupportPicker value={picked} onChange={(v) => { setPicked(v); setStatus(null); }} legend={parent ? "Support that helps your child (choose any)" : "I would like support with (choose any)"} />
          <StatusLine status={status} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={saveBtn}>{busy ? "Saving..." : "Save my support"}</button>
            {chosen.length > 0 && (
              <button type="button" onClick={() => { setEditing(false); setPicked(chosen); setStatus(null); }} className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-brand-deep card-border">Cancel</button>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <ul className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.filter((c) => chosen.includes(c.slug)).map((c) => (
              <li key={c.slug} className={`rounded-2xl ${c.card} p-4 card-border`}>
                <p className="font-bold text-ink">{c.title}</p>
                <p className="text-sm text-body">{c.summary}</p>
              </li>
            ))}
          </ul>
          <StatusLine status={status} />
          <button type="button" onClick={() => { setPicked(chosen); setEditing(true); setStatus(null); }} className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-brand-deep card-border hover:bg-brand-soft">
            Change my support
          </button>
        </div>
      )}
    </Section>
  );
}

function ExploreSection() {
  const { settings, updateSettings } = useStudent();
  return (
    <Section id="explore" title="Game Zone for ages 5 to 10" intro="Short games and ready-made lessons on letters, numbers, animals, feelings and more, with all your support switched on.">
      <label className="flex min-h-12 cursor-pointer items-center gap-3 text-lg font-semibold text-ink">
        <input type="checkbox" checked={settings.explore} onChange={(e) => updateSettings({ explore: e.target.checked })} className="size-6 accent-[#221a63]" />
        Show the Game Zone in my learning space
      </label>
    </Section>
  );
}

function PasswordSection() {
  const { user } = useStudent();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const errs = {
      current: current ? undefined : "Please enter your current password.",
      next: validateNewPassword(next) ?? (next === current ? "Choose a different password from the current one." : undefined),
    };
    setErrors(errs);
    setStatus(null);
    if (errs.current || errs.next) return;
    setBusy(true);
    try {
      const check = await supabase.auth.signInWithPassword({ email: user.email, password: current });
      if (check.error) {
        setErrors({ current: "That isn't your current password." });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      setCurrent("");
      setNext("");
      setStatus({ kind: "ok", text: "Your password is changed." });
    } catch {
      setStatus({ kind: "error", text: "We couldn't change your password. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section id="password" title="Password">
      <form onSubmit={save} noValidate className="space-y-5">
        <Field label="Current password" name="current" type="password" autoComplete="current-password" value={current} error={errors.current} onChange={(e) => setCurrent(e.target.value)} />
        <Field label="New password" name="new" type="password" autoComplete="new-password" value={next} error={errors.next} onChange={(e) => setNext(e.target.value)} />
        <p className="text-base text-body">At least 8 characters, with a letter and a number. Your password is never stored by ILUMO in readable form.</p>
        <StatusLine status={status} />
        <button type="submit" disabled={busy} className={saveBtn}>{busy ? "Saving..." : "Change password"}</button>
      </form>
    </Section>
  );
}

export default function SettingsPage() {
  const { user } = useStudent();
  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <p className="mb-3 inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">SETTINGS</p>
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Your settings</h1>
        <p className="mt-2 text-lg text-body">Update your details, the support you need and how ILUMO looks. Everything is saved to your account.</p>
      </header>

      <ProfileSection />
      {user.role === "student" && <SupportSection />}
      {user.role === "student" && <ExploreSection />}
      <PasswordSection />

      <Section id="display" title="Reading and display" intro="How text and audio work for you everywhere in ILUMO.">
        <AccessibilityControls />
      </Section>
    </div>
  );
}

