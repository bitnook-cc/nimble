import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { diceService, type DiceRollData, type CategorizedDie } from '@nimble/dice';

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
        return this.handleRollCommand(options);
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
  private handleRollCommand(options: CommandOption[]): InteractionResponse {
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
        allowCriticals: true, // Always allow since we support ! notation
        vicious: false, // Will be overridden by v notation if present
      });

      // Create rich embed for the response
      const embed = this.createDiceRollEmbed(result, formula, advantageLevel);

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
• **Vicious dice:** \`1d8v\` (adds extra die on critical)
• **Combined:** \`1d20!v\` (both exploding and vicious)
• **Double-digit dice:** \`1d44\`, \`1d66\`, \`1d88\`
• **Math operations:** \`(2d6+3)*2\`, \`1d20+5-2\`

## Advantage & Disadvantage
Add the \`advantage\` parameter:
• **Advantage:** \`/roll formula:1d20 advantage:1\` (rolls 2d20, keeps highest)
• **Greater advantage:** \`/roll formula:1d20 advantage:2\` (rolls 3d20, keeps highest)
• **Disadvantage:** \`/roll formula:1d20 advantage:-1\` (rolls 2d20, keeps lowest)

## Special Notations
• **!** = Exploding dice (reroll and add on max roll)
• **v** = Vicious (add extra die on critical, non-exploding)
• **Double-digit** = Rolls two dice for tens and ones (d44, d66, d88)

## Examples
• \`/roll formula:2d6+5\` - Roll 2d6 and add 5
• \`/roll formula:1d20! advantage:1\` - Roll d20 with advantage and exploding crits
• \`/roll formula:3d8v\` - Roll 3d8 with vicious dice
• \`/roll formula:1d44\` - Roll a d44 (two d4s for tens and ones)`;

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
  private createDiceRollEmbed(
    result: { displayString: string; total: number; formula: string; diceData?: DiceRollData },
    formula: string,
    advantageLevel: number,
  ): any {
    const diceData = result.diceData;
    if (!diceData) {
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

    // Determine color based on result
    let color = 0x3498db; // Default blue
    if (diceData.isFumble) {
      color = 0xff0000; // Red for fumble
    } else if (diceData.criticalHits && diceData.criticalHits > 0) {
      color = 0x00ff00; // Green for critical success
    } else if (formula.includes('d20')) {
      // Check for natural 20 or 1 on d20 rolls
      const firstKeptD20 = diceData.dice.find((d) => d.kept && d.size === 20);
      if (firstKeptD20) {
        if (firstKeptD20.value === 20) {
          color = 0x00ff00; // Green for nat 20
        } else if (firstKeptD20.value === 1) {
          color = 0xff0000; // Red for nat 1
        }
      }
    }

    // Build dice breakdown from rich data
    let diceBreakdown = '';

    // Format dice in their original order with category-based styling
    const formatDie = (die: CategorizedDie): string => {
      const value = `${die.value}`;

      switch (die.category) {
        case 'critical':
          return `**💥${value}**`; // Bold with explosion emoji for crits
        case 'vicious':
          return `**⚔️${value}**`; // Bold with sword emoji for vicious
        case 'fumble':
          return `**💀${value}**`; // Bold with skull emoji for fumbles
        case 'dropped':
          return `~~${value}~~`; // Strikethrough for dropped
        case 'normal':
        default:
          return `${value}`; // Code block for normal dice
      }
    };

    // Build dice display maintaining original order
    const diceDisplay: string[] = [];
    let previousWasKept = false;

    diceData.dice.forEach((die, index) => {
      if (index === 0 && !die.kept) {
        diceDisplay.push('('); // Open parenthesis if first die is dropped
      }

      // Add separators between kept and dropped dice
      if (index > 0) {
        if (die.kept && previousWasKept) {
          diceDisplay.push('+');
        } else if (die.kept && !previousWasKept) {
          diceDisplay.push(')');
        } else if (!die.kept && previousWasKept) {
          diceDisplay.push('(');
        } else if (!die.kept && !previousWasKept) {
          diceDisplay.push(',');
        }
      }

      diceDisplay.push(formatDie(die));
      previousWasKept = die.kept;
    });

    if (!previousWasKept) {
      diceDisplay.push(')'); // Close parenthesis if last die was dropped
    }

    // Add before/after expressions and total
    let fullDisplay = '';
    if (diceData.beforeExpression) {
      fullDisplay = diceData.beforeExpression + ' ';
    }
    fullDisplay += diceDisplay.join(' ');
    if (diceData.afterExpression) {
      fullDisplay += ' ' + diceData.afterExpression;
    }
    diceBreakdown = fullDisplay + ` = **${diceData.total}**`;

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

    // Add advantage/disadvantage field if applicable
    if (advantageLevel !== 0) {
      let advText = '';
      let advEmoji = '';
      if (advantageLevel > 0) {
        advEmoji = '✨';
        advText = advantageLevel === 1 ? 'Advantage' : `Advantage ${advantageLevel}`;
      } else {
        advEmoji = '💀';
        advText =
          Math.abs(advantageLevel) === 1
            ? 'Disadvantage'
            : `Disadvantage ${Math.abs(advantageLevel)}`;
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
    if (diceData.criticalHits && diceData.criticalHits > 0) {
      specialNotes.push(
        `🎯 ${diceData.criticalHits} critical hit${diceData.criticalHits > 1 ? 's' : ''}!`,
      );
    }
    if (diceData.isFumble) {
      specialNotes.push(`💀 Fumbled! (Natural 1)`);
    }
    if (diceData.isDoubleDigit) {
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
