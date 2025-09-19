import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID; // Optional: for guild-specific commands

if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN) {
  console.error('Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN in environment variables');
  process.exit(1);
}

// Define the commands
const commands = [
  {
    name: 'roll',
    description: 'Roll dice using Nimble dice notation',
    options: [
      {
        type: 3, // STRING
        name: 'formula',
        description: 'Dice formula (e.g., 2d6+5, 1d20!, 1d8v) - use /help for more info',
        required: true,
      },
      {
        type: 4, // INTEGER
        name: 'advantage',
        description: 'Positive = advantage (roll extra, keep highest), negative = disadvantage',
        required: false,
      },
    ],
  },
  {
    name: 'attack',
    description:
      'Make an attack roll using Nimble dice notation. Attack rolls automatically crit, miss and explode.',
    options: [
      {
        type: 3, // STRING
        name: 'formula',
        description: 'Dice formula (e.g., 2d6+5, 1d20!, 1d8v) - use /help for more info',
        required: true,
      },
      {
        type: 4, // INTEGER
        name: 'advantage',
        description: 'Positive = advantage (roll extra, keep highest), negative = disadvantage',
        required: false,
      },
    ],
  },
  {
    name: 'help',
    description: 'Learn how to use the Nimble dice bot and dice notation',
  },
];

// Register commands
async function registerCommands() {
  try {
    // Determine endpoint - guild-specific or global
    const endpoint = DISCORD_GUILD_ID
      ? `https://discord.com/api/v10/applications/${DISCORD_APP_ID}/guilds/${DISCORD_GUILD_ID}/commands`
      : `https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`;

    console.log(`Registering commands at: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register commands: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('Successfully registered commands:', data);

    if (DISCORD_GUILD_ID) {
      console.log('Commands registered for guild:', DISCORD_GUILD_ID);
      console.log('Note: Guild commands are available immediately');
    } else {
      console.log('Commands registered globally');
      console.log('Note: Global commands may take up to 1 hour to propagate');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

// Run the registration
registerCommands();
