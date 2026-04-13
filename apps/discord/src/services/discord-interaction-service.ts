import { InteractionType, InteractionResponseType } from 'discord-interactions';
import {
  diceService,
  calculateAverageDamage,
  type CategorizedDie,
  type DiceFormulaResult,
  type DiceTokenResult,
} from '@nimble/dice';

// Discord interaction types
interface CommandOption {
  name: string;
  value?: string | number | boolean;
  type?: number;
}

interface InteractionData {
  name?: string;
  options?: CommandOption[];
}

interface Interaction {
  type: number;
  data?: InteractionData;
}

interface InteractionResponse {
  type: number;
  data?: {
    content?: string;
    flags?: number;
    embeds?: any[];
  };
}

export class DiscordInteractionService {
  /**
   * Handle incoming Discord interaction
   */
  handleInteraction(interaction: Interaction): InteractionResponse | { error: string } {
    const { type, data } = interaction;

    // Handle Discord ping
    if (type === InteractionType.PING) {
      return { type: InteractionResponseType.PONG };
    }

    // Handle slash commands
    if (type === InteractionType.APPLICATION_COMMAND && data) {
      const { name, options } = data;

      if (name === 'roll' && options) {
        return this.handleRollCommand(options, false);
      }

      if (name === 'attack' && options) {
        return this.handleRollCommand(options, true);
      }

      if (name === 'average' && options) {
        return this.handleAverageCommand(options);
      }

      if (name === 'help') {
        return this.handleHelpCommand();
      }
    }

    // Unknown command
    return { error: 'Unknown command' };
  }

  /**
   * Handle the /roll command
   */
  private handleRollCommand(options: CommandOption[], isAttack: boolean): InteractionResponse {
    try {
      // Parse options
      const formulaValue = options.find((opt) => opt.name === 'formula')?.value;

      // Enforce formula is a string
      if (typeof formulaValue !== 'string') {
        throw new Error('Formula must be a string');
      }
      const formula = formulaValue;

      const advantageValue = options.find((opt) => opt.name === 'advantage')?.value;

      // Enforce advantage is a number (if provided)
      if (advantageValue !== undefined && typeof advantageValue !== 'number') {
        throw new Error('Advantage must be a number');
      }
      const advantageLevel = advantageValue ?? 0;

      // Roll the dice
      const result = diceService.evaluateDiceFormula(formula, {
        advantageLevel,
        allowCriticals: isAttack, // Always allow since we support ! notation
        allowFumbles: true, // Always allow since we support natural 1s
        vicious: false, // Will be overridden by v notation if present
      });

      // Create rich embed for the response
      const embed = this.createDiceRollEmbed(result, formula);

      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [embed],
        },
      };
    } catch (error) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ **Error rolling dice:** ${error instanceof Error ? error.message : 'Unknown error'}`,
          flags: 64, // Ephemeral message (only visible to user)
        },
      };
    }
  }

  /**
   * Handle the /help command
   */
  private handleHelpCommand(): InteractionResponse {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: 64,
        embeds: [
          {
            title: '🎲 Nimble Dice Bot',
            color: 0x3498db,
            fields: [
              {
                name: 'Commands',
                value: [
                  '`/roll formula:<dice>` — Roll dice',
                  '`/attack formula:<dice>` — Attack roll (crits & misses)',
                  '`/average formula:<dice>` — Expected average damage',
                  '`/help` — This help message',
                ].join('\n'),
                inline: false,
              },
              {
                name: 'Dice Notation',
                value: [
                  '`2d6`, `1d20`, `3d4+5` — Basic rolls',
                  '`1d20+5`, `2d8-3` — With modifiers',
                  '`1d20!` — Exploding crits (reroll on max)',
                  '`3d6!!` — All dice explode',
                  '`1d8v` — Vicious (extra die on crit)',
                  '`d44`, `d66`, `d88` — Double-digit dice',
                  '`(2d6+3)*2` — Math operations',
                ].join('\n'),
                inline: false,
              },
              {
                name: 'Advantage & Disadvantage',
                value: [
                  '`1d20a` — Advantage (roll 2, keep highest)',
                  '`1d20a3` — Triple advantage (roll 4, keep highest)',
                  '`1d20d` — Disadvantage (roll 2, keep lowest)',
                  '`/roll formula:1d20 advantage:1` — Via parameter',
                  '',
                  '⚠️ Place a/d AFTER ! and v: `1d20!va`',
                ].join('\n'),
                inline: false,
              },
              {
                name: '📊 Average Damage',
                value: [
                  '`/average formula:2d8+10` — Shows expected damage',
                  'Accounts for Nimble rules:',
                  '• Miss on natural 1 (0 damage)',
                  '• Exploding crits on max roll',
                  '• Vicious bonus dice (`v`)',
                  '• Double-digit dice skip miss/crit',
                ].join('\n'),
                inline: false,
              },
              {
                name: 'Examples',
                value: [
                  '`/roll formula:2d6+5`',
                  '`/attack formula:1d20!a`',
                  '`/average formula:3d8v+10`',
                  '`/roll formula:d66`',
                ].join('\n'),
                inline: false,
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * Handle the /average command
   */
  private handleAverageCommand(options: CommandOption[]): InteractionResponse {
    try {
      const formulaValue = options.find((opt) => opt.name === 'formula')?.value;

      if (typeof formulaValue !== 'string') {
        throw new Error('Formula must be a string');
      }
      const formula = formulaValue;

      const nimbleAvg = calculateAverageDamage(formula, true);
      const naiveAvg = calculateAverageDamage(formula, false);

      if (nimbleAvg === null || naiveAvg === null) {
        throw new Error(`Could not parse formula: \`${formula}\``);
      }

      const fields = [
        {
          name: 'Formula',
          value: `\`${formula}\``,
          inline: true,
        },
        {
          name: 'Nimble Average',
          value: `**${nimbleAvg}**`,
          inline: true,
        },
        {
          name: 'Naive Average',
          value: `${naiveAvg}`,
          inline: true,
        },
      ];

      const diff = nimbleAvg - naiveAvg;
      if (diff !== 0) {
        fields.push({
          name: 'Miss/Crit Impact',
          value: `${diff > 0 ? '+' : ''}${Math.round(diff * 10) / 10} (${diff < 0 ? 'miss penalty > crit bonus' : 'crit bonus > miss penalty'})`,
          inline: false,
        });
      }

      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: '📊 Average Damage Calculator',
              color: 0x9b59b6,
              description:
                'Expected damage per attack using Nimble dice rules (miss on 1, exploding crits).',
              fields,
              footer: {
                text: 'Nimble avg accounts for: miss on natural 1, exploding crits on max roll, vicious (v)',
              },
            },
          ],
        },
      };
    } catch (error) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❌ **Error calculating average:** ${error instanceof Error ? error.message : 'Unknown error'}`,
          flags: 64,
        },
      };
    }
  }

  /**
   * Create a rich embed for dice roll results
   */
  private createDiceRollEmbed(result: DiceFormulaResult, formula: string): any {
    // Extract all dice tokens
    const diceTokens = result.tokens.filter((token) => token.type === 'dice') as DiceTokenResult[];

    if (diceTokens.length === 0) {
      // Fallback to simple embed if no dice data
      return {
        title: '🎲 Dice Roll Result',
        color: 0x3498db,
        fields: [
          { name: 'Formula', value: `\`${formula}\``, inline: true },
          { name: 'Total', value: `**${result.total}**`, inline: true },
        ],
        footer: { text: `Raw: ${result.displayString}` },
      };
    }

    // Aggregate data from all dice tokens
    const allDice: CategorizedDie[] = [];
    let totalCriticalHits = 0;
    let hasFumble = false;
    let hasDoubleDigit = false;
    let commonAdvantageLevel: number | null = null;
    let hasConsistentAdvantage = true;

    for (const diceToken of diceTokens) {
      const diceData = diceToken.diceData;
      allDice.push(...diceData.dice);
      totalCriticalHits += diceData.criticalHits || 0;
      hasFumble = hasFumble || diceData.isFumble || false;
      hasDoubleDigit = hasDoubleDigit || diceData.isDoubleDigit || false;

      const advantageLevel = diceData.advantageLevel || 0;
      if (commonAdvantageLevel === null) {
        commonAdvantageLevel = advantageLevel;
      } else if (commonAdvantageLevel !== advantageLevel) {
        hasConsistentAdvantage = false;
      }
    }

    // Determine color based on aggregated result
    let color = 0x3498db; // Default blue
    if (hasFumble) {
      color = 0xff0000; // Red for fumble
    } else if (totalCriticalHits > 0) {
      color = 0x00ff00; // Green for critical success
    } else if (formula.includes('d20')) {
      // Check for natural 20 or 1 on d20 rolls
      const firstKeptD20 = allDice.find((d) => d.kept && d.size === 20);
      if (firstKeptD20) {
        if (firstKeptD20.value === 20) {
          color = 0x00ff00; // Green for nat 20
        } else if (firstKeptD20.value === 1) {
          color = 0xff0000; // Red for nat 1
        }
      }
    }

    // Build dice breakdown from rich data using tokens
    let diceBreakdown = '';

    // Format dice in their original order with category-based styling
    const formatDie = (die: CategorizedDie): string => {
      const value = `${die.value}`;

      switch (die.category) {
        case 'critical':
          return `**🎯[${value}]**`; // Bold with target emoji for crits
        case 'explosion':
          return `**💥[${value}]**`; // Bold with explosion emoji for explosions
        case 'vicious':
          return `**⚔️[${value}]**`; // Bold with sword emoji for vicious
        case 'fumble':
          return `**💀[${value}]**`; // Bold with skull emoji for fumbles
        case 'dropped':
          return `~~[${value}]~~`; // Strikethrough for dropped
        case 'normal':
          return `[${value}]`; // Normal formatting for regular dice
      }
    };

    // Build breakdown by iterating through tokens and formatting dice
    const breakdownParts: string[] = [];

    for (const token of result.tokens) {
      if (token.type === 'dice') {
        const diceToken = token as DiceTokenResult;
        const dice = diceToken.diceData.dice;

        // Format all dice in this token
        const tokenBreakdown = dice.map(formatDie).join(' ');

        breakdownParts.push(tokenBreakdown);
      } else if (token.type === 'static') {
        breakdownParts.push(token.value.toString());
      } else if (token.type === 'operator') {
        breakdownParts.push(token.operator);
      }
    }

    diceBreakdown = breakdownParts.join(' ');

    // Build the embed
    const embed: any = {
      title: '🎲 Dice Roll Result',
      color: color,
      fields: [
        {
          name: 'Formula',
          value: `\`${formula}\``,
          inline: true,
        },
        {
          name: 'Total',
          value: `**${result.total}**`,
          inline: true,
        },
      ],
    };

    // Add advantage/disadvantage field if applicable (only if all dice have consistent advantage)
    if (hasConsistentAdvantage && commonAdvantageLevel !== null && commonAdvantageLevel !== 0) {
      let advText = '';
      let advEmoji = '';
      const absAdvantageLevel = Math.abs(commonAdvantageLevel);
      if (commonAdvantageLevel > 0) {
        advEmoji = '✨';
        advText = absAdvantageLevel === 1 ? 'Advantage' : `Advantage ${absAdvantageLevel}`;
      } else {
        advEmoji = '💀';
        advText = absAdvantageLevel === 1 ? 'Disadvantage' : `Disadvantage ${absAdvantageLevel}`;
      }
      embed.fields.push({
        name: 'Modifier',
        value: `${advEmoji} ${advText}`,
        inline: true,
      });
    }

    // Add dice breakdown
    if (diceBreakdown) {
      embed.fields.push({
        name: 'Dice Breakdown',
        value: diceBreakdown,
        inline: false,
      });
    }

    // Add special notes if any
    const specialNotes: string[] = [];
    if (totalCriticalHits > 0) {
      specialNotes.push(`🎯 ${totalCriticalHits} critical hit${totalCriticalHits > 1 ? 's' : ''}!`);
    }
    if (hasFumble) {
      specialNotes.push(`💀 Fumbled! (Natural 1)`);
    }
    if (hasDoubleDigit) {
      specialNotes.push(`🎲 Double-digit dice roll`);
    }

    if (specialNotes.length > 0) {
      embed.fields.push({
        name: 'Special',
        value: specialNotes.join('\n'),
        inline: false,
      });
    }

    return embed;
  }
}

// Export singleton instance
export const discordInteractionService = new DiscordInteractionService();
