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

// Mock the service
vi.mock('../services/discord-interaction-service', () => ({
  discordInteractionService: {
    handleInteraction: vi.fn(),
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

    // Setup default request with Buffer body (mimics express.raw())
    req = {
      method: 'POST',
      headers: {
        'x-signature-ed25519': 'mock-signature',
        'x-signature-timestamp': 'mock-timestamp',
      },
      body: Buffer.from('{}', 'utf-8'),
    } as any;

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

  it('should delegate valid requests to the service', async () => {
    const { verifyKey } = await import('discord-interactions');
    const { discordInteractionService } = await import('../services/discord-interaction-service');

    (verifyKey as any).mockReturnValue(true);
    (discordInteractionService.handleInteraction as any).mockReturnValue({
      type: InteractionResponseType.PONG,
    });

    const body = { type: InteractionType.PING };
    req.body = Buffer.from(JSON.stringify(body), 'utf-8');

    await handler(req as VercelRequest, res as VercelResponse);

    expect(discordInteractionService.handleInteraction).toHaveBeenCalledWith(body);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({ type: InteractionResponseType.PONG });
  });

  it('should handle service errors properly', async () => {
    const { verifyKey } = await import('discord-interactions');
    const { discordInteractionService } = await import('../services/discord-interaction-service');

    (verifyKey as any).mockReturnValue(true);
    (discordInteractionService.handleInteraction as any).mockReturnValue({
      error: 'Unknown command',
    });

    const body = {
      type: InteractionType.APPLICATION_COMMAND,
      data: { name: 'unknown' },
    };
    req.body = Buffer.from(JSON.stringify(body), 'utf-8');

    await handler(req as VercelRequest, res as VercelResponse);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Unknown command' });
  });
});
