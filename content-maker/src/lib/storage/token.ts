import "server-only";
import { SignJWT, jwtVerify } from "jose";

// Short-lived signed token for the Local provider's download URLs — mimics an
// S3 presigned URL: whoever holds a valid, unexpired token for a key may GET it.
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-secret-change-in-production-0123456789abcdef"
);

export async function signStorageToken(key: string, expiresSec = 300): Promise<string> {
  return new SignJWT({ k: key, s: "dl" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresSec)
    .sign(secret);
}

export async function verifyStorageToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.s !== "dl" || typeof payload.k !== "string") return null;
    return payload.k;
  } catch {
    return null;
  }
}
