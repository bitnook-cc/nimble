import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { DiscordInteractionService } from '../discord-interaction-service';

// Mock the dice service
vi.mock('@nimble/dice', () => ({
  diceService: {
    evaluateDiceFormula: vi.fn(),
  },
}));

describe('DiscordInteractionService', () => {
  let service: DiscordInteractionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DiscordInteractionService();
  });

  describe('handleInteraction', () => {
    it('should respond to Discord PING', () => {
      const result = service.handleInteraction({
        type: InteractionType.PING,
      });

      expect(result).toEqual({ type: InteractionResponseType.PONG });
    });

    it('should handle unknown commands', () => {
      const result = service.handleInteraction({
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'unknown',
        },
      });

      expect(result).toEqual({ error: 'Unknown command' });
    });

    describe('roll command', () => {
      it('should handle successful dice roll', async () => {
        const { diceService } = await import('@nimble/dice');
        (diceService.evaluateDiceFormula as any).mockReturnValue({
          formula: '2d6+5',
          total: 12,
          displayString: '[4] + [3] + 5',
        });

        const result = service.handleInteraction({
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'roll',
            options: [{ name: 'formula', value: '2d6+5' }],
          },
        });

        expect(diceService.evaluateDiceFormula).toHaveBeenCalledWith('2d6+5', {
          advantageLevel: 0,
          allowCriticals: true,
          vicious: false,
        });

        expect(result).toEqual({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: expect.stringContaining('🎲 **Rolling:** `2d6+5`'),
          },
        });

        expect(result).toEqual({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: expect.stringContaining('**Total:** **12**'),
          },
        });
      });

      it('should handle roll with advantage', async () => {
        const { diceService } = await import('@nimble/dice');
        (diceService.evaluateDiceFormula as any).mockReturnValue({
          formula: '1d20',
          total: 18,
          displayString: '~~[10]~~ + [18]',
        });

        const result = service.handleInteraction({
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'roll',
            options: [
              { name: 'formula', value: '1d20' },
              { name: 'advantage', value: 1 },
            ],
          },
        });

        expect(diceService.evaluateDiceFormula).toHaveBeenCalledWith('1d20', {
          advantageLevel: 1,
          allowCriticals: true,
          vicious: false,
        });

        expect(result).toEqual({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: expect.stringContaining('✨ **Advantage 1**'),
          },
        });
      });

      it('should handle roll with disadvantage', async () => {
        const { diceService } = await import('@nimble/dice');
        (diceService.evaluateDiceFormula as any).mockReturnValue({
          formula: '1d20',
          total: 3,
          displayString: '[10] + ~~[3]~~',
        });

        const result = service.handleInteraction({
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'roll',
            options: [
              { name: 'formula', value: '1d20' },
              { name: 'advantage', value: -1 },
            ],
          },
        });

        expect(diceService.evaluateDiceFormula).toHaveBeenCalledWith('1d20', {
          advantageLevel: -1,
          allowCriticals: true,
          vicious: false,
        });

        expect(result).toEqual({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: expect.stringContaining('💀 **Disadvantage 1**'),
          },
        });
      });

      it('should handle dice rolling errors', async () => {
        const { diceService } = await import('@nimble/dice');
        (diceService.evaluateDiceFormula as any).mockImplementation(() => {
          throw new Error('Invalid dice type: d7');
        });

        const result = service.handleInteraction({
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'roll',
            options: [{ name: 'formula', value: '1d7' }],
          },
        });

        expect(result).toEqual({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Error rolling dice: Invalid dice type: d7',
            flags: 64, // Ephemeral
          },
        });
      });

      it('should handle missing formula gracefully', () => {
        const result = service.handleInteraction({
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'roll',
            options: [],
          },
        });

        expect(result).toEqual({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: expect.stringContaining('Error rolling dice:'),
            flags: 64,
          },
        });
      });
    });
  });
});
