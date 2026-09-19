"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./client";

/** Whether someone is signed in (null until we know), and a sign-out helper. */
export function useAuthSession() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);
  return { signedIn, signOut };
}
