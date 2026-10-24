import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "news_admin";

function signature(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function isValidAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not configured.");
  const candidateHash = createHmac("sha256", "news-admin-password").update(candidate).digest();
  const expectedHash = createHmac("sha256", "news-admin-password").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function createAdminSession(secure: boolean): Promise<void> {
  const value = "admin";
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${value}.${signature(value)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminSession(): Promise<boolean> {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  const [value, suppliedSignature] = cookie.split(".");
  if (value !== "admin" || !suppliedSignature) return false;
  const expectedSignature = signature(value);
  const supplied = Buffer.from(suppliedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
