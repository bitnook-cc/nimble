import "dotenv/config";
import { SessionOptions } from "iron-session";
import { AuthUser } from "@nimble/shared";

export interface SessionData {
  user?: AuthUser;
  googleOAuth?: { state: string; redirectUri: string; createdAt: number };
}

const password = process.env.SESSION_SECRET;
if (
  !password ||
  password.length < 32 ||
  /^(complex_password|your_session_secret)/.test(password)
) {
  throw new Error(
    "SESSION_SECRET must be a private random secret of at least 32 characters",
  );
}

export const sessionOptions: SessionOptions = {
  password,
  ttl: 60 * 60 * 24,
  cookieName: "nimble_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.COOKIE_DOMAIN
      ? ("lax" as const)
      : process.env.NODE_ENV === "production"
        ? ("none" as const)
        : ("lax" as const),
    maxAge: 60 * 60 * 24, // 24 hours in seconds
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
  },
};
