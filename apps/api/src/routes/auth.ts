import { Router } from 'express';
import passport from 'passport';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '../config/session';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth-service';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);

// Google OAuth login
router.get('/google', (req, res, next) => {
  // Pass the redirect URI through the state parameter
  const redirectUri = req.query.redirect_uri as string || '';
  
  // Encode the redirect URI in the state parameter
  const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: state 
  })(req, res, next);
});

// Google OAuth callback
router.get(
  '/google/callback',
  (req, res, next) => {
    // Store state in request for failure handling
    const state = req.query.state as string;
    const failureRedirect = state ? `/auth/failure?state=${encodeURIComponent(state)}` : '/auth/failure';
    
    passport.authenticate('google', { session: false }, async (err, user) => {
      if (err || !user) {
        return res.redirect(failureRedirect);
      }
      
      // Save user to iron-session
      const session = await getIronSession<SessionData>(req, res, sessionOptions);
      session.user = user;
      await session.save();
      
      // Decode the state parameter to get the redirect URI
      let redirectUri = '';
      
      if (req.query.state) {
        try {
          const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
          redirectUri = stateData.redirectUri || '';
        } catch (error) {
          console.error('Failed to decode state:', error);
        }
      }
      
      // Fallback to a default if no redirect URI
      if (!redirectUri) {
        redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
      }
      
      // Redirect to the client callback page with success status
      res.redirect(`${redirectUri}?status=success`);
    })(req, res, next);
  }
);

// Logout
router.post('/logout', async (req, res) => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/user', async (req, res) => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  
  if (!session.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Ensure user exists in database and get updated session
  const user = await authService.ensureUserExists(session);
  
  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Authentication failure
router.get('/failure', (req, res) => {
  // Decode the state parameter to get the redirect URI
  let redirectUri = '';
  
  if (req.query.state) {
    try {
      const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
      redirectUri = stateData.redirectUri || '';
    } catch (error) {
      console.error('Failed to decode state:', error);
    }
  }
  
  // Fallback to a default if no redirect URI
  if (!redirectUri) {
    redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
  }
  
  // Redirect to the client callback page with failure status
  res.redirect(`${redirectUri}?status=failed`);
});

export default router;