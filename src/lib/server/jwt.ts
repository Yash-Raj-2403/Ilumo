import { jwtVerify, SignJWT } from "jose";

// Signs and verifies the access tokens issued at login/signup. Replaces Supabase Auth's JWTs
// with an equivalent HS256 token, kept deliberately small: just enough to identify the user.

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set.");
  return new TextEncoder().encode(s);
};

const ISSUER = "ilumo";
const TTL = "30d";

export type TokenPayload = { sub: string; email: string; role: string };

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(TTL)
    .sign(secret());
}

/** Returns the payload if the token is valid and unexpired, otherwise null (never throws). */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return { sub: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
