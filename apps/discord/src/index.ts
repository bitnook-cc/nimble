import express from 'express';
import * as dotenv from 'dotenv';
import interactionsHandler from './interactions';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Apply appropriate middleware based on the routes
app.use((req, res, next) => {
  console.log("Raw Request: ", req.body, req)
  if (req.path === '/interactions') {
    // Use raw body parser for Discord interactions (returns Buffer)
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    // Apply JSON parsing for all other endpoints
    express.json()(req, res, next);
  }
});

// Discord interactions endpoint - delegate to the interactions handler
app.post('/interactions', interactionsHandler);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nimble-discord' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Discord bot server listening on port ${PORT}`);
  console.log(`Set your Discord interaction endpoint URL to: https://your-domain.com/interactions`);
});

export default app;
