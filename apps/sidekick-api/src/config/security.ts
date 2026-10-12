import "dotenv/config";
import { timingSafeEqual } from "node:crypto";

export const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  (process.env.NODE_ENV === "production"
    ? "https://nimble.bitnook.cc,https://nimble-navigator.vercel.app"
    : "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:4000,http://localhost:4321")
)
  .split(",")
  .map((value) => new URL(value.trim()).origin);

export function isAllowedOrigin(origin: string): boolean {
  try {
    return (
      allowedOrigins.includes(new URL(origin).origin) &&
      new URL(origin).origin === origin
    );
  } catch {
    return false;
  }
}

export function validateCallbackUrl(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.includes("\\") ||
    [...value].some((char) => char.charCodeAt(0) <= 32)
  )
    return null;
  try {
    const url = new URL(value);
    if (
      !isAllowedOrigin(url.origin) ||
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    if (url.pathname !== "/auth/callback" && url.pathname !== "/auth/callback/")
      return null;
    return url.href;
  } catch {
    return null;
  }
}

export function validOAuthState(
  received: unknown,
  expected: { state: string; createdAt: number } | undefined,
): boolean {
  if (
    typeof received !== "string" ||
    !expected ||
    typeof expected.state !== "string" ||
    !Number.isFinite(expected.createdAt) ||
    Date.now() - expected.createdAt > 10 * 60 * 1000 ||
    expected.createdAt > Date.now()
  )
    return false;
  const a = Buffer.from(received),
    b = Buffer.from(expected.state);
  return a.length === b.length && timingSafeEqual(a, b);
}
