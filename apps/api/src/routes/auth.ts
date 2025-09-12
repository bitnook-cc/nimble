import { Router } from 'express';
import passport from 'passport';

const router = Router();

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
    console.log("oogle Callback", req.query);
    passport.authenticate('google', { failureRedirect })(req, res, next);
  },
  (req, res) => {
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
    console.log("Redirect URI:", redirectUri);
    // Fallback to a default if no redirect URI
    if (!redirectUri) {
      redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
    }
    
    // Redirect to the client callback page with success status
    res.redirect(`${redirectUri}?status=success`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    return res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
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