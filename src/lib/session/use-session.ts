"use client";

import { useCallback, useEffect, useState } from "react";
import { auth, sessionStore } from "./client";

/** Whether someone is signed in (null until we know), and a sign-out helper. */
export function useAuthSession() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => alive && setSignedIn(!!sessionStore.get()));
    const unsubscribe = sessionStore.subscribe((s) => setSignedIn(!!s));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(() => auth.signOut(), []);
  return { signedIn, signOut };
}
