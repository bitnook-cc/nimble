import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (_req, res) => {
    // Successful authentication
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}?auth=success`);
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
router.get('/failure', (_req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.redirect(`${clientUrl}?auth=failed`);
});

export default router;