// Types and validation shared by the auth screens and the auth API routes.

import { CATEGORIES, type CategorySlug } from "./categories";

export type Role = "student" | "parent";
/** What kind of support someone needs = which accessibility categories apply to them. */
export type Need = CategorySlug;
export type Child = { name: string; age: number; needs: Need[] };

/** Only allow post-login redirects that stay inside the signed-in areas. */
export const safeNext = (v: string | null) =>
  v && /^\/(?:student|parent)(?:[/?#]|$)/.test(v) && !v.includes("//") ? v : null;

export const NEEDS = CATEGORIES.map((c) => ({ id: c.slug, label: c.title, short: c.short, summary: c.summary }));
export const ALL_SLUGS: CategorySlug[] = CATEGORIES.map((c) => c.slug);

// Earlier versions stored broader labels; map them onto the current categories.
const LEGACY: Record<string, CategorySlug | null> = {
  visual: "blind-low-vision", hearing: "deaf-hoh", speech: "speech", cognitive: "autism", unsure: null,
};

/** Clean up a list of supports coming from storage or a request: known slugs only, no repeats. */
export function normalizeSupports(list: unknown): CategorySlug[] {
  if (!Array.isArray(list)) return [];
  const out = list
    .map((v) => (typeof v === "string" ? (ALL_SLUGS.includes(v as CategorySlug) ? (v as CategorySlug) : (LEGACY[v] ?? null)) : null))
    .filter((v): v is CategorySlug => v !== null);
  return [...new Set(out)];
}

// ---- validation ---------------------------------------------------------
export const validateEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : "Please enter a valid email, like name@example.com.";

export const validateName = (v: string) => {
  const n = v.trim();
  if (n.length < 2) return "Please tell us your name (at least 2 letters).";
  if (n.length > 50) return "That name is a bit long. Try a shorter one.";
  return null;
};

export const validateNewPassword = (v: string) => {
  if (v.length < 8) return "Use at least 8 characters.";
  if (!/[a-zA-Z]/.test(v) || !/\d/.test(v)) return "Include at least one letter and one number.";
  return null;
};

export const validateLoginPassword = (v: string) => (v ? null : "Please enter your password.");

/** 0-4 strength, plus which simple rules are met (for the checklist). */
export function passwordStrength(v: string) {
  const rules = [
    { label: "8+ characters", ok: v.length >= 8 },
    { label: "A letter", ok: /[a-zA-Z]/.test(v) },
    { label: "A number", ok: /\d/.test(v) },
    { label: "A symbol or capital (bonus)", ok: /[^a-zA-Z0-9]/.test(v) || (/[A-Z]/.test(v) && /[a-z]/.test(v)) },
  ];
  return { score: rules.filter((r) => r.ok).length, rules };
}

export function validateChild(c: unknown): Child | null {
  if (!c || typeof c !== "object") return null;
  const o = c as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const age = Number(o.age);
  const needs = normalizeSupports(o.needs);
  if (name.length < 2 || name.length > 50 || !Number.isInteger(age) || age < 3 || age > 19 || needs.length === 0) return null;
  return { name, age, needs };
}
