import { users, type UserDoc } from "@/lib/mongo/collections";
import { verifyToken } from "./jwt";

export type AuthedUser = Pick<UserDoc, "email" | "name" | "role" | "child" | "childIds" | "parentId"> & { id: string };

const toAuthedUser = (doc: UserDoc): AuthedUser => ({
  id: doc._id,
  email: doc.email,
  name: doc.name,
  role: doc.role,
  child: doc.child,
  childIds: doc.childIds,
  parentId: doc.parentId,
});

/** Identify the signed-in user from the request's `Authorization: Bearer <token>` header. */
export async function requireUser(request: Request): Promise<AuthedUser | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const doc = await (await users()).findOne({ _id: payload.sub });
  return doc ? toAuthedUser(doc) : null;
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

/** The signed-in user, only if they are a parent. */
export async function requireParent(request: Request): Promise<{ user: AuthedUser; name: string } | null> {
  const user = await requireUser(request);
  return user?.role === "parent" ? { user, name: user.name } : null;
}
