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
