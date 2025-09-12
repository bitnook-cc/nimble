import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport';
import authRoutes from './routes/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // Set domain to parent domain if configured (e.g., ".nimble.com" for subdomain sharing)
    domain: process.env.COOKIE_DOMAIN || undefined,
    // Use 'lax' for subdomain sharing, 'none' for cross-domain
    sameSite: process.env.COOKIE_DOMAIN ? 'lax' : (process.env.NODE_ENV === 'production' ? 'none' : 'lax')
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration - allow specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    // Default production URLs (override with ALLOWED_ORIGINS env var)
    'https://nimble.bitnook.cc',
    'https://nimble-navigator.vercel.app'
  ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all localhost origins
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Hello world endpoint
app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Nimble API!' });
});

// Auth routes
app.use('/auth', authRoutes);

// Example API endpoint
app.get('/hello', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ 
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  });
});

// Protected API endpoint example
app.get('/api/protected', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      message: 'This is a protected route',
      user: req.user 
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Start server only if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`✨ API server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;