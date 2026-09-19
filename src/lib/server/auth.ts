import { supabaseAdmin } from "@/lib/supabase/admin";

/** Identify the signed-in user from the request's `Authorization: Bearer <token>` header. */
export async function requireUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  return error || !data.user ? null : data.user;
}

// Tiny in-memory limiter (per server instance) to slow down account probing.
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max = 15, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

export const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

/** The signed-in user, only if their profile says they are a parent. */
export async function requireParent(request: Request) {
  const user = await requireUser(request);
  if (!user) return null;
  const { data } = await supabaseAdmin().from("profiles").select("role, name").eq("id", user.id).maybeSingle();
  return data?.role === "parent" ? { user, name: data.name as string } : null;
}
