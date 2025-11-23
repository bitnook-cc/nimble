/**
 * Tests for Beyond20 Sharing Service
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DiceRollEntry, InitiativeEntry } from "@/lib/schemas/activity-log";
import { Character } from "@/lib/schemas/character";
import { settingsService } from "@/lib/services/settings-service";

import { beyond20DetectionService } from "../beyond20-detection-service";
import { Beyond20SharingService } from "../beyond20-sharing-service";

// Mock the dependencies
vi.mock("../beyond20-detection-service", () => ({
  beyond20DetectionService: {
    getIsInstalled: vi.fn(),
  },
}));

vi.mock("@/lib/services/settings-service", () => ({
  settingsService: {
    getSettings: vi.fn(),
  },
}));

describe("Beyond20SharingService", () => {
  let service: Beyond20SharingService;
  let mockCharacter: Character;
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new Beyond20SharingService();

    // Create mock character
    mockCharacter = {
      id: "test-char-1",
      name: "Test Hero",
      level: 5,
    } as Character;

    // Setup DOM spy
    dispatchEventSpy = vi.spyOn(document, "dispatchEvent") as unknown as ReturnType<
      typeof vi.spyOn
    >;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("sendRoll", () => {
    it("should not send roll if Beyond20 is not installed", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(false);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: DiceRollEntry = {
        id: "roll-1",
        timestamp: new Date(),
        type: "roll",
        description: "Attack Roll",
        characterId: mockCharacter.id,
        rollExpression: "1d20+5",
        diceResult: {
          total: 18,
          formula: "1d20+5",
          tokens: [],
          displayString: "18",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it("should not send roll if Beyond20 is not enabled in settings", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: false });

      const entry: DiceRollEntry = {
        id: "roll-1",
        timestamp: new Date(),
        type: "roll",
        description: "Attack Roll",
        characterId: mockCharacter.id,
        rollExpression: "1d20+5",
        diceResult: {
          total: 18,
          formula: "1d20+5",
          tokens: [],
          displayString: "18",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it("should send dice roll when Beyond20 is installed and enabled", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: DiceRollEntry = {
        id: "roll-1",
        timestamp: new Date(),
        type: "roll",
        description: "Attack Roll",
        characterId: mockCharacter.id,
        rollExpression: "1d20+5",
        diceResult: {
          total: 18,
          formula: "1d20+5",
          tokens: [],
          displayString: "18",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Beyond20_SendMessage",
          detail: expect.arrayContaining([
            expect.objectContaining({
              action: "roll",
              type: "custom",
              character: {
                name: "Test Hero",
                level: 5,
              },
              name: "Attack Roll",
              roll: 18,
              formula: "1d20+5",
              advantage: 0,
              d20: true,
            }),
          ]),
        }),
      );
    });

    it("should handle advantage in dice rolls", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: DiceRollEntry = {
        id: "roll-1",
        timestamp: new Date(),
        type: "roll",
        description: "Attack with Advantage",
        characterId: mockCharacter.id,
        rollExpression: "1d20+5",
        advantageLevel: 1,
        diceResult: {
          total: 18,
          formula: "1d20+5",
          tokens: [],
          displayString: "18",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.arrayContaining([
            expect.objectContaining({
              advantage: 1,
            }),
          ]),
        }),
      );
    });

    it("should handle disadvantage in dice rolls", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: DiceRollEntry = {
        id: "roll-1",
        timestamp: new Date(),
        type: "roll",
        description: "Attack with Disadvantage",
        characterId: mockCharacter.id,
        rollExpression: "1d20+5",
        advantageLevel: -1,
        diceResult: {
          total: 8,
          formula: "1d20+5",
          tokens: [],
          displayString: "8",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.arrayContaining([
            expect.objectContaining({
              advantage: 2,
            }),
          ]),
        }),
      );
    });

    it("should send initiative rolls", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: InitiativeEntry = {
        id: "init-1",
        timestamp: new Date(),
        type: "initiative",
        description: "Initiative roll",
        characterId: mockCharacter.id,
        actionsGranted: 3,
        rollExpression: "1d20+2",
        diceResult: {
          total: 15,
          formula: "1d20+2",
          tokens: [],
          displayString: "15",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.arrayContaining([
            expect.objectContaining({
              action: "roll",
              type: "initiative",
              roll: 15,
              formula: "1d20+2",
              d20: true,
            }),
          ]),
        }),
      );
    });

    it("should not send initiative roll without dice result", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: InitiativeEntry = {
        id: "init-1",
        timestamp: new Date(),
        type: "initiative",
        description: "Initiative roll",
        characterId: mockCharacter.id,
        actionsGranted: 3,
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it("should detect d20 rolls correctly", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: DiceRollEntry = {
        id: "roll-1",
        timestamp: new Date(),
        type: "roll",
        description: "Damage Roll",
        characterId: mockCharacter.id,
        rollExpression: "2d6+3",
        diceResult: {
          total: 11,
          formula: "2d6+3",
          tokens: [],
          displayString: "11",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.arrayContaining([
            expect.objectContaining({
              d20: false,
            }),
          ]),
        }),
      );
    });

    it("should use substituted formula if available", async () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);
      vi.mocked(settingsService.getSettings).mockResolvedValue({ beyond20Enabled: true });

      const entry: DiceRollEntry = {
        id: "roll-1",
        timestamp: new Date(),
        type: "roll",
        description: "Attribute Check",
        characterId: mockCharacter.id,
        rollExpression: "1d20+STR",
        diceResult: {
          total: 18,
          formula: "1d20+STR",
          substitutedFormula: "1d20+4",
          tokens: [],
          displayString: "18",
          numCriticals: 0,
          isFumble: false,
        },
      };

      await service.sendRoll(entry, mockCharacter);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.arrayContaining([
            expect.objectContaining({
              formula: "1d20+4",
            }),
          ]),
        }),
      );
    });
  });

  describe("activateIcon", () => {
    it("should dispatch activate icon event when Beyond20 is installed", () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(true);

      service.activateIcon();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Beyond20_Activate_Icon",
        }),
      );
    });

    it("should not dispatch event when Beyond20 is not installed", () => {
      vi.mocked(beyond20DetectionService.getIsInstalled).mockReturnValue(false);

      service.activateIcon();

      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
  });
});
