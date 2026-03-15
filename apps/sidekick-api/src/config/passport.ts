import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import { AuthUser } from "@nimble/shared";

const prisma = new PrismaClient();

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.API_URL
        ? `${process.env.API_URL}/auth/google/callback`
        : `http://localhost:${process.env.PORT || 3001}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || "";
        const googleId = profile.id;

        // Find or create user in database
        const dbUser = await prisma.user.upsert({
          where: { googleId },
          update: {
            // Update user info in case it changed
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
            // Increment login count
            loginCount: { increment: 1 },
            lastLoginAt: new Date(),
          },
          create: {
            googleId,
            email,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
            loginCount: 1,
            lastLoginAt: new Date(),
          },
        });

        // Return user object with login count and timestamps
        const user: AuthUser = {
          id: dbUser.id,
          googleId: dbUser.googleId,
          email: dbUser.email,
          name: dbUser.name,
          picture: dbUser.picture || undefined,
          loginCount: dbUser.loginCount,
          lastLoginAt: dbUser.lastLoginAt,
          createdAt: dbUser.createdAt,
        };

        return done(null, user);
      } catch (error) {
        console.error("Error in Google OAuth callback:", error);
        return done(error as Error, undefined);
      }
    },
  ),
);

// No need for serializeUser/deserializeUser with iron-session
// Iron-session handles session storage directly

export default passport;
