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
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://nimble-api.vercel.app/auth/google/callback'
        : 'http://localhost:3001/auth/google/callback',
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

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: User, done) => {
  done(null, user);
});

export default passport;