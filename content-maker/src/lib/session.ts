import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { can, isAdminRole, type Permission } from "./rbac";

// ============================================================================
// Minimal secure session: httpOnly, signed JWT (HS256) via AUTH_SECRET.
// Production target is Auth.js (documented) — this is a dependency-light,
// standards-based implementation: hashed passwords (bcrypt) + signed session.
// The token carries the tenant + role so every query can be tenant-scoped.
// ============================================================================

const COOKIE = "cm_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-secret-change-in-production-0123456789abcdef"
);

export type Session = {
  uid: string;
  tid: string;   // tenantId — the isolation boundary
  role: string;
  scope: string; // client | admin
  name: string;
};

export async function createSession(s: Session): Promise<void> {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** Guard for app pages — redirects to /login when unauthenticated. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

/** Guard for admin area. */
export async function requireAdmin(): Promise<Session> {
  const s = await requireSession();
  if (!isAdminRole(s.role)) redirect("/dashboard");
  return s;
}

export function assertCan(session: Session, permission: Permission): void {
  if (!can(session.role, permission)) {
    throw new Error("FORBIDDEN: missing permission " + permission);
  }
}
