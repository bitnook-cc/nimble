import type { VercelRequest, VercelResponse } from '@vercel/node';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import { diceService } from '@nimble/dice';

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the request came from Discord
  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;
  const rawBody = JSON.stringify(req.body);

  const isValidRequest = verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);
  if (!isValidRequest) {
    return res.status(401).json({ error: 'Invalid request signature' });
  }

  const { type, data } = req.body;

  // Handle ping from Discord
  if (type === InteractionType.PING) {
    return res.status(200).json({ type: InteractionResponseType.PONG });
  }

  // Handle slash commands
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = data;

    if (name === 'roll') {
      const formula = options?.[0]?.value;
      const advantageOption = options?.find((opt: any) => opt.name === 'advantage');
      const criticalOption = options?.find((opt: any) => opt.name === 'critical');
      const viciousOption = options?.find((opt: any) => opt.name === 'vicious');

      if (!formula) {
        return res.status(200).json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Please provide a dice formula! Example: `/roll 2d6+5`',
          },
        });
      }

      try {
        const result = diceService.evaluateDiceFormula(formula, {
          advantageLevel: advantageOption?.value || 0,
          allowCriticals: criticalOption?.value || false,
          vicious: viciousOption?.value || false,
        });

        return res.status(200).json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: '🎲 Dice Roll',
                color: 0x5865f2,
                fields: [
                  {
                    name: 'Formula',
                    value: `\`${result.formula}\``,
                    inline: true,
                  },
                  {
                    name: 'Total',
                    value: `**${result.total}**`,
                    inline: true,
                  },
                  {
                    name: 'Rolls',
                    value: result.displayString,
                    inline: false,
                  },
                ],
              },
            ],
          },
        });
      } catch (error) {
        return res.status(200).json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `❌ Error rolling dice: ${error instanceof Error ? error.message : 'Unknown error'}`,
            flags: 64, // Ephemeral message
          },
        });
      }
    }
  }

  // Default response
  return res.status(200).json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: 'Unknown command',
    },
  });
}
