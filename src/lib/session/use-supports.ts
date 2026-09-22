"use client";

import { useEffect, useState } from "react";
import { normalizeSupports, type Role } from "@/lib/auth-shared";
import type { CategorySlug } from "@/lib/categories";
import { sessionStore } from "./client";
import { loadProfile } from "./data";

type Mine = { role: Role | null; supports: CategorySlug[] | null };

/**
 * Who is signed in: their role, and the support categories they chose.
 * `supports` is null when everything should be shown (signed out, a parent, not chosen yet,
 * or the profile couldn't be read).
 */
export function useMyProfile(): Mine {
  const [mine, setMine] = useState<Mine>({ role: null, supports: null });

  useEffect(() => {
    let alive = true;
    const load = async (userId?: string) => {
      if (!userId) return alive && setMine({ role: null, supports: null });
      try {
        const p = await loadProfile(userId);
        const own = normalizeSupports((p?.settings as { supports?: unknown } | null)?.supports);
        const list = own.length ? own : normalizeSupports(p?.child?.needs);
        const role = p?.role ?? null;
        if (alive) setMine({ role, supports: role === "student" && list.length ? list : null });
      } catch {
        if (alive) setMine({ role: null, supports: null });
      }
    };
    load(sessionStore.get()?.user.id);
    const unsubscribe = sessionStore.subscribe((s) => load(s?.user.id));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return mine;
}

export const useMySupports = () => useMyProfile().supports;
