import type { Request, Response } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyKey } from 'discord-interactions';
import { discordInteractionService } from './services/discord-interaction-service.js';
import { track } from '@vercel/analytics/server';

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

type HandlerRequest = Request | VercelRequest;
type HandlerResponse = Response | VercelResponse;

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const bodyBuffer = req.body as Buffer;
  const body = JSON.parse(bodyBuffer.toString('utf-8'));

  // Verify the request came from Discord
  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;

  const isValidRequest = await verifyKey(bodyBuffer, signature, timestamp, PUBLIC_KEY);

  if (isValidRequest !== true) {
    return res.status(401).json({ error: 'Invalid request signature' });
  }

  // Handle the interaction using the service
  const result = discordInteractionService.handleInteraction(body);

  // Track the interaction
  const isError = 'error' in result;
  await track('discord-interaction', {
    type: body.type,
    success: !isError,
    command_name: body.data?.name,
    guild_id: body.guild_id,
    user_id: body.member?.user?.id || body.user?.id,
  }).catch(console.warn);

  // Check if it's an error response
  if (isError) {
    return res.status(400).json(result);
  }

  // Send the interaction response
  return res.status(200).json(result);
}
