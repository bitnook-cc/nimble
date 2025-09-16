import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import handler from '../interactions';

// Mock the discord-interactions verifyKey function
vi.mock('discord-interactions', async () => {
  const actual = await vi.importActual('discord-interactions');
  return {
    ...actual,
    verifyKey: vi.fn(),
  };
});

// Mock the dice service
vi.mock('@nimble/dice', () => ({
  diceService: {
    evaluateDiceFormula: vi.fn(),
  },
}));

describe('Discord Interactions Handler', () => {
  let req: Partial<VercelRequest>;
  let res: Partial<VercelResponse>;
  const mockJson = vi.fn();
  const mockStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup response mock
    mockJson.mockClear();
    mockStatus.mockClear();
    mockStatus.mockReturnValue({ json: mockJson });

    res = {
      status: mockStatus,
      json: mockJson,
    };

    // Setup default request
    req = {
      method: 'POST',
      headers: {
        'x-signature-ed25519': 'mock-signature',
        'x-signature-timestamp': 'mock-timestamp',
      },
      body: {},
    };

    // Set up environment variable
    process.env.DISCORD_PUBLIC_KEY = 'mock-public-key';
  });

  it('should reject non-POST requests', async () => {
    req.method = 'GET';

    await handler(req as VercelRequest, res as VercelResponse);

    expect(mockStatus).toHaveBeenCalledWith(405);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should reject requests with invalid signature', async () => {
    const { verifyKey } = await import('discord-interactions');
    (verifyKey as any).mockReturnValue(false);

    await handler(req as VercelRequest, res as VercelResponse);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid request signature' });
  });

  it('should respond to Discord PING', async () => {
    const { verifyKey } = await import('discord-interactions');
    (verifyKey as any).mockReturnValue(true);

    req.body = {
      type: InteractionType.PING,
    };

    await handler(req as VercelRequest, res as VercelResponse);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({ type: InteractionResponseType.PONG });
  });

  describe('Roll Command', () => {
    beforeEach(async () => {
      const { verifyKey } = await import('discord-interactions');
      (verifyKey as any).mockReturnValue(true);

      req.body = {
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'roll',
          options: [],
        },
      };
    });

    it('should handle roll command without formula', async () => {
      await handler(req as VercelRequest, res as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Please provide a dice formula! Example: `/roll 2d6+5`',
        },
      });
    });

    it('should handle successful dice roll', async () => {
      const { diceService } = await import('@nimble/dice');
      (diceService.evaluateDiceFormula as any).mockReturnValue({
        formula: '2d6+5',
        total: 12,
        displayString: '[4] + [3] + 5',
      });

      req.body!.data.options = [{ name: 'formula', value: '2d6+5' }];

      await handler(req as VercelRequest, res as VercelResponse);

      expect(diceService.evaluateDiceFormula).toHaveBeenCalledWith('2d6+5', {
        advantageLevel: 0,
        allowCriticals: false,
        vicious: false,
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: '🎲 Dice Roll',
              color: 0x5865f2,
              fields: [
                {
                  name: 'Formula',
                  value: '`2d6+5`',
                  inline: true,
                },
                {
                  name: 'Total',
                  value: '**12**',
                  inline: true,
                },
                {
                  name: 'Rolls',
                  value: '[4] + [3] + 5',
                  inline: false,
                },
              ],
            },
          ],
        },
      });
    });

    it('should handle roll with advantage', async () => {
      const { diceService } = await import('@nimble/dice');
      (diceService.evaluateDiceFormula as any).mockReturnValue({
        formula: '1d20',
        total: 18,
        displayString: '~~[10]~~ + [18]',
      });

      req.body!.data.options = [
        { name: 'formula', value: '1d20' },
        { name: 'advantage', value: 1 },
      ];

      await handler(req as VercelRequest, res as VercelResponse);

      expect(diceService.evaluateDiceFormula).toHaveBeenCalledWith('1d20', {
        advantageLevel: 1,
        allowCriticals: false,
        vicious: false,
      });
    });

    it('should handle roll with critical and vicious', async () => {
      const { diceService } = await import('@nimble/dice');
      (diceService.evaluateDiceFormula as any).mockReturnValue({
        formula: '1d6',
        total: 13,
        displayString: '[6] + [3] + [4]',
      });

      req.body!.data.options = [
        { name: 'formula', value: '1d6' },
        { name: 'critical', value: true },
        { name: 'vicious', value: true },
      ];

      await handler(req as VercelRequest, res as VercelResponse);

      expect(diceService.evaluateDiceFormula).toHaveBeenCalledWith('1d6', {
        advantageLevel: 0,
        allowCriticals: true,
        vicious: true,
      });
    });

    it('should handle dice rolling errors', async () => {
      const { diceService } = await import('@nimble/dice');
      (diceService.evaluateDiceFormula as any).mockImplementation(() => {
        throw new Error('Invalid dice type: d7');
      });

      req.body!.data.options = [{ name: 'formula', value: '1d7' }];

      await handler(req as VercelRequest, res as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Error rolling dice: Invalid dice type: d7',
          flags: 64, // Ephemeral
        },
      });
    });
  });

  it('should handle unknown commands', async () => {
    const { verifyKey } = await import('discord-interactions');
    (verifyKey as any).mockReturnValue(true);

    req.body = {
      type: InteractionType.APPLICATION_COMMAND,
      data: {
        name: 'unknown',
      },
    };

    await handler(req as VercelRequest, res as VercelResponse);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Unknown command',
      },
    });
  });
});
