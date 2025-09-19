import { InteractionType, InteractionResponseType } from 'discord-interactions';
import {
  diceService,
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
    const helpText = `# 🎲 Nimble Dice Bot Help

## Basic Usage
Use \`/roll formula:<dice notation>\` to roll dice.

## Dice Notation Examples
• **Basic rolls:** \`2d6\`, \`1d20\`, \`3d4+5\`
• **With modifiers:** \`1d20+5\`, \`2d8-3\`, \`1d6+2d4+7\`
• **Exploding criticals:** \`1d20!\` (rerolls on max value)
• **All dice explode:** \`3d6!!\` (ALL max rolls explode, not just first)
• **Vicious dice:** \`1d8v\` (adds extra die on critical)
• **Combined:** \`1d20!v\` or \`2d6!!v\` (exploding + vicious)
• **Double-digit dice:** \`d44\`, \`d66\`, \`d88\`
• **Math operations:** \`(2d6+3)*2\`, \`1d20+5-2\`

## Advantage & Disadvantage
**Option 1: Use postfix notation**
• **Advantage:** \`1d20a\` or \`1d20a1\` (rolls 2d20, keeps highest)
• **Multiple advantage:** \`1d20a3\` (rolls 4d20, keeps highest)
• **Disadvantage:** \`1d20d\` or \`1d20d1\` (rolls 2d20, keeps lowest)
• **Multiple disadvantage:** \`1d20d2\` (rolls 3d20, keeps lowest)

**IMPORTANT**
When using postfix notation, the order of operations is important. Always place the advantage/disadvantage postfix AFTER any exploding or vicious postfixes.

**Option 2: Use the advantage parameter**
• **Advantage:** \`/roll formula:1d20 advantage:1\`
• **Disadvantage:** \`/roll formula:1d20 advantage:-1\`

## Special Notations
• **!** = Exploding dice (first die rerolls on max)
• **!!** = All dice explode (ALL dice reroll on max)
• **v** = Vicious (add extra die on critical)
• **a** = Advantage (roll extra, keep highest)
• **d** = Disadvantage (roll extra, keep lowest)
• **Double-digit** = Rolls two dice for tens and ones (d44, d66, d88). Note: Double-digit rolls cannot crit or explode.

## Examples
• \`/roll formula:2d6+5\` - Roll 2d6 and add 5
• \`/roll formula:1d20!a\` - Roll d20 with advantage and exploding crits
• \`/roll formula:4d4!!\` - Roll 4d4 where ALL 4s explode
• \`/roll formula:3d8v\` - Roll 3d8 with vicious dice
• \`/roll formula:1d20d2+5\` - Roll d20 with double disadvantage, add 5
• \`/roll formula:d44a\` - Roll a d44 with advantage`;

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: helpText,
        flags: 64, // Ephemeral (only visible to the user who ran the command)
      },
    };
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
          return `**🎯${value}**`; // Bold with target emoji for crits
        case 'explosion':
          return `**💥${value}**`; // Bold with explosion emoji for explosions
        case 'vicious':
          return `**⚔️${value}**`; // Bold with sword emoji for vicious
        case 'fumble':
          return `**💀${value}**`; // Bold with skull emoji for fumbles
        case 'dropped':
          return `~~${value}~~`; // Strikethrough for dropped
        case 'normal':
          return `${value}`; // Normal formatting for regular dice
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
