import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Hello world endpoint
app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Nimble API!' });
});

// Example API endpoint
app.get('/api/hello', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ 
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  });
});

// Start server only if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`✨ API server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;