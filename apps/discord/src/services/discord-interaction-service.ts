import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { diceService } from '@nimble/dice';

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
    content: string;
    flags?: number;
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

      // Format the response
      const content = this.formatDiceResult(result, advantageLevel);

      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content,
        },
      };
    } catch (error) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Error rolling dice: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * Format the dice result for Discord
   */
  private formatDiceResult(
    result: { displayString: string; total: number; formula: string },
    advantageLevel: number,
  ): string {
    let response = `🎲 **Rolling:** \`${result.formula}\`\n`;

    if (advantageLevel > 0) {
      response += `✨ **Advantage ${advantageLevel}**\n`;
    } else if (advantageLevel < 0) {
      response += `💀 **Disadvantage ${Math.abs(advantageLevel)}**\n`;
    }

    response += `\n${result.displayString}\n`;
    response += `\n**Total:** **${result.total}**`;

    return response;
  }
}

// Export singleton instance
export const discordInteractionService = new DiscordInteractionService();
