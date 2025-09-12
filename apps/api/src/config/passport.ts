import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

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
        // In a real app, you would save/update the user in your database here
        const user: User = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
        };
        
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// No need for serializeUser/deserializeUser with iron-session
// Iron-session handles session storage directly

export default passport;