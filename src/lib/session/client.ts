"use client";

// Lightweight client-side session store, replacing the Supabase Auth SDK. A JWT + the signed-in
// user's basic info are kept in localStorage; every API call attaches the token as a bearer
// header (see authed-fetch.ts) and every route verifies it server-side (see lib/server/jwt.ts).

export type SessionUser = { id: string; email: string; name: string; role: "student" | "parent"; child: unknown };
export type Session = { token: string; user: SessionUser };

const KEY = "ilumo.session";
const EVENT = "ilumo:session-change";

function read(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null; // private browsing, storage disabled, or corrupt data
  }
}

function write(next: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: session still works for this tab via the in-memory event below */
  }
  window.dispatchEvent(new CustomEvent<Session | null>(EVENT, { detail: next }));
}

/** The low-level store: get/set the session and subscribe to changes (including other tabs). */
export const sessionStore = {
  get: read,
  set: write,
  subscribe(cb: (s: Session | null) => void) {
    const onChange = (e: Event) => cb((e as CustomEvent<Session | null>).detail ?? read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) cb(read());
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  },
};

async function readJson(res: Response) {
  return res.json().catch(() => ({}));
}

/** Auth actions used by the login/signup flow and account settings. */
export const auth = {
  getSession: async () => ({ data: { session: read() } }),
  getUser: async () => ({ data: { user: read()?.user ?? null } }),

  onAuthStateChange(cb: (event: "SIGNED_IN" | "SIGNED_OUT", session: Session | null) => void) {
    const unsubscribe = sessionStore.subscribe((s) => cb(s ? "SIGNED_IN" : "SIGNED_OUT", s));
    return { data: { subscription: { unsubscribe } } };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await readJson(res);
    if (!res.ok) return { data: { user: null }, error: { message: data.error ?? "That email and password don't match." } };
    write({ token: data.token, user: data.user });
    return { data: { user: data.user }, error: null };
  },

  async signOut() {
    write(null);
    return { error: null };
  },

  /** Store a session obtained directly from an API response (e.g. right after signup). */
  setSession(session: Session) {
    write(session);
  },

  /** Swap in a fresh token (e.g. after the email changes, since it's carried as a token claim). */
  refreshToken(token: string) {
    const current = read();
    if (current) write({ ...current, token });
  },

  /** Update the cached user fields in place (after a save that doesn't need a new token). */
  updateCachedUser(patch: Partial<SessionUser>) {
    const current = read();
    if (current) write({ ...current, user: { ...current.user, ...patch } });
  },
};
