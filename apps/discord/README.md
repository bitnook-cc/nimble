# Nimble Discord Bot

Discord bot for rolling dice using the Nimble dice engine. Uses HTTP interactions (no persistent connection required).

## Features

- `/roll` command with full Nimble dice notation support
- Advantage/disadvantage system
- Exploding criticals (`!` notation)
- Vicious dice (`v` notation)
- Double-digit dice (d44, d66, d88)
- Full breakdown showing all rolled dice

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "General Information" and copy:
   - Application ID → `DISCORD_APP_ID`
   - Public Key → `DISCORD_PUBLIC_KEY`
4. Go to "Bot" section:
   - Click "Reset Token" and copy → `DISCORD_BOT_TOKEN`
   - Under "Privileged Gateway Intents", you don't need any special intents

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Discord credentials
```

### 3. Install Dependencies

```bash
# From monorepo root
npm install

# Build the shared dice package
cd packages/nimble-dice
npm run build
```

### 4. Register Commands

```bash
# From apps/discord
npm run register-commands
```

### 5. Set Interaction Endpoint URL

1. In Discord Developer Portal, go to your application
2. Go to "General Information"
3. Set "Interactions Endpoint URL" to your server URL + `/interactions`
   - For local testing: Use ngrok or similar: `https://your-ngrok-url.ngrok.io/interactions`
   - For production: `https://your-domain.com/interactions`

### 6. Run the Bot

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 7. Invite Bot to Server

1. In Discord Developer Portal, go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Copy the generated URL and open it to invite the bot

## Deployment Options

### Vercel (Recommended)

This bot is configured to deploy as a standalone Vercel serverless function:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy from discord directory
cd apps/discord
vercel

# Follow prompts:
# - Link to existing project or create new
# - Project name: nimble-discord
# - Directory: ./ (current directory)
```

Set environment variables in Vercel dashboard or during deployment:

- `DISCORD_PUBLIC_KEY` - Your Discord app's public key
- `DISCORD_APPLICATION_ID` - Your Discord app ID (for command registration)
- `DISCORD_BOT_TOKEN` - Your bot token (for command registration)

After deployment:

1. Copy your Vercel URL (e.g., `https://nimble-discord-bot.vercel.app`)
2. In Discord Developer Portal, set Interactions Endpoint URL to: `https://your-vercel-url.vercel.app/interactions`
3. Discord will verify the endpoint automatically

### Traditional Hosting

Deploy to any Node.js hosting service (Railway, Render, Heroku, VPS, etc.):

1. Set environment variables
2. Run `npm run build` and `npm start`
3. Ensure port 3002 (or your configured PORT) is accessible
4. Update Discord interaction endpoint

## Usage

In Discord, use the `/roll` command:

```
/roll formula:2d6+5
/roll formula:1d20! advantage:1
/roll formula:3d8v advantage:-1
```

## Dice Notation

- Basic: `2d6`, `1d20`, `3d4+5`
- Exploding criticals: `1d20!` (explodes on max roll)
- Vicious: `1d8v` (adds extra die on critical)
- Combined: `1d20!v` (both exploding and vicious)
- Double-digit: `1d44`, `1d66`, `1d88`
- Math: `(2d6+3)*2`, `1d20+5-2`
