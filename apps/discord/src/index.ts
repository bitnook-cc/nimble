import express from 'express';
import * as dotenv from 'dotenv';
import interactionsHandler from './interactions';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

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
