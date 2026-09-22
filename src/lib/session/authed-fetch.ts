import { sessionStore } from "./client";

/** fetch() that attaches the signed-in user's token for our API routes. */
export async function authedFetch(input: string, init: RequestInit = {}) {
  const session = sessionStore.get();
  const headers = new Headers(init.headers);
  if (session) headers.set("Authorization", `Bearer ${session.token}`);
  return fetch(input, { ...init, headers });
}
