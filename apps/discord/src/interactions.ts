import 'dotenv/config';
import type { Request, Response } from 'express';
import { verifyKey } from 'discord-interactions';
import { discordInteractionService } from './services/discord-interaction-service.js';
import { track } from '@vercel/analytics/server';

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

type HandlerRequest = Request;
type HandlerResponse = Response;

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const bodyBuffer = req.body as Buffer;

  // Verify the request came from Discord
  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;

  let isValidRequest = false;
  try {
    isValidRequest = await verifyKey(bodyBuffer, signature, timestamp, PUBLIC_KEY);
  } catch {
    /* Invalid signatures fail closed. */
  }

  if (isValidRequest !== true) {
    return res.status(401).json({ error: 'Invalid request signature' });
  }

  let body;
  try {
    body = JSON.parse(bodyBuffer.toString('utf-8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
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
