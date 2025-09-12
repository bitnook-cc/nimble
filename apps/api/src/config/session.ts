import { SessionOptions } from 'iron-session';

export interface SessionData {
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'nimble_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.COOKIE_DOMAIN ? 'lax' as const : (process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const),
    maxAge: 60 * 60 * 24, // 24 hours in seconds
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  },
};

