"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Field } from "@/components/auth/auth-ui";
import { validateEmail, validateName } from "@/lib/auth-shared";

type Errors = { name?: string; email?: string; message?: string };

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState(""); // a hidden box only bots fill in
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Errors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      message: message.trim().length < 10 ? "Please write at least a sentence (10 characters)." : message.length > 2000 ? "That's a bit long. Please keep it under 2000 characters." : undefined,
    };
    setErrors(errs);
    setFormError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website: trap }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't send that right now. Please try again.");
      setSent(true);
    } catch (err) {
      setFormError(err instanceof TypeError ? "We couldn't connect. Check your internet and try again." : err instanceof Error ? err.message : "We couldn't send that right now.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-3xl bg-tint-green p-8 text-center ring-1 ring-brand-deep/10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white"><Check className="size-8" aria-hidden /></span>
        <h2 className="mt-4 text-3xl font-bold text-ink">Thank you, {name.trim().split(" ")[0]}!</h2>
        <p className="mt-2 text-xl text-ink">Your message has been sent. We&apos;ll get back to you at {email.trim()}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6 rounded-3xl bg-white p-6 ring-1 ring-brand-deep/10 sm:p-8">
      <Field label="Your name" name="name" autoComplete="name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
      <Field label="Your email" name="email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
      <div>
        <label htmlFor="msg" className="mb-2 block text-sm font-semibold text-brand-deep">Your message</label>
        <textarea
          id="msg"
          rows={6}
          value={message}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "msg-err" : undefined}
          onChange={(e) => setMessage(e.target.value)}
          className={`w-full rounded-2xl border-2 bg-white px-5 py-4 text-xl text-ink shadow-sm outline-none transition focus:border-brand focus:shadow-[0_0_0_4px_rgba(91,77,245,0.15)] ${errors.message ? "border-rose-600" : "border-brand-deep/15 hover:border-brand-deep/30"}`}
        />
        <div aria-live="assertive" id="msg-err">{errors.message && <p className="mt-2 font-semibold text-rose-700">⚠ {errors.message}</p>}</div>
      </div>
      {/* Honeypot: hidden from people and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>
      </div>
      {formError && <p role="alert" className="rounded-2xl bg-tint-pink p-4 font-semibold text-ink ring-1 ring-black/20">{formError}</p>}
      <button type="submit" disabled={busy} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-brand px-8 text-lg font-semibold text-white shadow-[0_10px_25px_rgba(91,77,245,0.35)] disabled:opacity-60">
        <Send className="size-5" aria-hidden /> {busy ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
