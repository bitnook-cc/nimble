import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { diceService } from '@nimble/dice';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

if (!PUBLIC_KEY) {
  console.error('Missing DISCORD_PUBLIC_KEY in environment variables');
  process.exit(1);
}

// Verify Discord signatures on the interactions endpoint
app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const { type, data } = req.body;

  // Handle Discord ping
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  // Handle slash commands
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = data;

    if (name === 'roll') {
      return handleRollCommand(options, res);
    }
  }

  // Unknown command
  return res.status(400).json({ error: 'Unknown command' });
});

// Handle the /roll command
function handleRollCommand(options: any[], res: express.Response) {
  try {
    // Parse options
    const formula = options.find((opt) => opt.name === 'formula')?.value || '';
    const advantageLevel = options.find((opt) => opt.name === 'advantage')?.value || 0;

    // Roll the dice
    const result = diceService.evaluateDiceFormula(formula, {
      advantageLevel,
      allowCriticals: true, // Always allow since we support ! notation
      vicious: false, // Will be overridden by v notation if present
    });

    // Format the response
    const content = formatDiceResult(result, advantageLevel);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content,
      },
    });
  } catch (error) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Error rolling dice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        flags: 64, // Ephemeral message (only visible to user)
      },
    });
  }
}

// Format the dice result for Discord
function formatDiceResult(
  result: { displayString: string; total: number; formula: string },
  advantageLevel: number,
): string {
  let response = `🎲 **Rolling:** \`${result.formula}\`\n`;

  if (advantageLevel > 0) {
    response += `✨ **Advantage ${advantageLevel}**\n`;
  } else if (advantageLevel < 0) {
    response += `💀 **Disadvantage ${Math.abs(advantageLevel)}**\n`;
  }

  response += `\n${result.displayString}\n`;
  response += `\n**Total:** **${result.total}**`;

  return response;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nimble-discord-bot' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Discord bot server listening on port ${PORT}`);
  console.log(`Set your Discord interaction endpoint URL to: https://your-domain.com/interactions`);
});
