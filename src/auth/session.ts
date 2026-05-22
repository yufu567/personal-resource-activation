import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-in-production-min-32-chars!!",
);

const COOKIE_NAME = "pra_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createSession(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SESSION_SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string, email: string): Promise<void> {
  const token = await createSession(userId, email);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Read the current user session from the request cookie */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Get the current userId from the session, or fall back to demo-user */
export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  return session?.userId ?? "demo-user";
}
