"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/auth/auth-ui";
import { SupportPicker } from "@/components/auth/auth-steps";
import { validateEmail, validateName, validateNewPassword, type Need } from "@/lib/auth-shared";
import { authedFetch } from "@/lib/session/authed-fetch";
import type { ChildSummary } from "./child-types";

type Errors = { name?: string; email?: string; age?: string; password?: string; supports?: string };

/** Creates the child's own ILUMO login and links it to this parent. */
export function AddChildForm({ onCreated }: { onCreated: (c: ChildSummary, login: { email: string; password: string }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [supports, setSupports] = useState<Need[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Errors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      age: !age || Number(age) < 3 || Number(age) > 19 ? "Enter an age from 3 to 19." : undefined,
      password: validateNewPassword(password) ?? undefined,
      supports: supports.length === 0 ? "Choose at least one, or tap \"I'm not sure yet\"." : undefined,
    };
    setErrors(errs);
    setFormError(null);
    if (Object.values(errs).some(Boolean)) return;

    setBusy(true);
    try {
      const res = await authedFetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, age: Number(age), password, supports }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) setErrors({ email: data.error });
        else setFormError(data.error ?? "We couldn't create the account right now.");
        return;
      }
      onCreated(data.child, { email: email.trim().toLowerCase(), password });
      setName(""); setEmail(""); setAge(""); setPassword(""); setSupports([]); setErrors({});
    } catch {
      setFormError("We couldn't connect. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        <Field label="Child's name" name="childName" autoComplete="off" placeholder="e.g. Aarav" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
        <Field label="Age" name="childAge" inputMode="numeric" placeholder="e.g. 10" value={age} error={errors.age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))} />
      </div>
      <Field label="Child's email (their login)" name="childEmail" type="email" autoComplete="off" placeholder="child@example.com" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
      <div>
        <Field
          label="A password for your child"
          name="childPassword"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="grid size-11 place-items-center rounded-full text-brand-deep hover:bg-brand-soft">
              {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
              <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
            </button>
          }
        />
        <p className="mt-2 text-base text-body">At least 8 characters, with a letter and a number. Tell your child this password. They can change it in their own settings.</p>
      </div>
      <SupportPicker value={supports} onChange={(v) => { setSupports(v); setErrors((x) => ({ ...x, supports: undefined })); }} legend="What kind of support helps your child most? (choose any)" />
      <div aria-live="assertive">
        {errors.supports && <p className="text-base font-semibold text-rose-700">⚠ {errors.supports}</p>}
        {formError && <p role="alert" className="rounded-2xl bg-tint-pink p-4 font-semibold text-ink ring-1 ring-black/20">{formError}</p>}
      </div>
      <button type="submit" disabled={busy} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)] disabled:opacity-60">
        <Check className="size-5" aria-hidden /> {busy ? "Creating account..." : "Create my child's account"}
      </button>
    </form>
  );
}
