import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BackgroundDefinition } from "@/lib/schemas/background";
import type { Character } from "@/lib/schemas/character";
import type { CharacterFeature } from "@/lib/schemas/features";

import { BackgroundService } from "../background-service";

// Create mock functions
const mockGetBackgroundDefinition = vi.fn();
const mockGetAllBackgrounds = vi.fn();
const mockAddCustomBackground = vi.fn();
const mockRemoveCustomBackground = vi.fn();

// Mock ContentRepositoryService
vi.mock("../content-repository-service", () => ({
  ContentRepositoryService: {
    getInstance: vi.fn(() => ({
      getBackgroundDefinition: mockGetBackgroundDefinition,
      getAllBackgrounds: mockGetAllBackgrounds,
      addCustomBackground: mockAddCustomBackground,
      removeCustomBackground: mockRemoveCustomBackground,
    })),
  },
}));

describe("BackgroundService", () => {
  let backgroundService: BackgroundService;

  const mockBackground: BackgroundDefinition = {
    id: "test-background",
    name: "Test Background",
    description: "A test background",
    features: [
      {
        id: "test-feature",
        name: "Test Feature",
        description: "A test feature",
        traits: [
          {
            id: "test-effect-1",
            type: "stat_bonus",
            statBonus: {
              skills: {
                deception: {
                  type: "fixed",
                  value: 2,
                },
              },
            },
          } as any,
        ],
      },
    ],
  };

  const mockCharacter = {
    id: "test-char",
    name: "Test Character",
    level: 1,
    classId: "fighter",
    ancestryId: "test-ancestry",
    backgroundId: "test-background",
  } as Character;

  beforeEach(() => {
    vi.clearAllMocks();
    backgroundService = new BackgroundService();
  });

  describe("getCharacterBackground", () => {
    it("should return background definition for a character", () => {
      mockGetBackgroundDefinition.mockReturnValue(mockBackground);

      const result = backgroundService.getCharacterBackground(mockCharacter);

      expect(result).toEqual(mockBackground);
      expect(mockGetBackgroundDefinition).toHaveBeenCalledWith("test-background");
    });

    it("should return null for character with non-existent background", () => {
      mockGetBackgroundDefinition.mockReturnValue(null);

      const result = backgroundService.getCharacterBackground(mockCharacter);

      expect(result).toBeNull();
      expect(mockGetBackgroundDefinition).toHaveBeenCalledWith("test-background");
    });
  });

  describe("getExpectedFeaturesForCharacter", () => {
    it("should return features for character with background", () => {
      mockGetBackgroundDefinition.mockReturnValue(mockBackground);

      const result = backgroundService.getExpectedFeaturesForCharacter(mockCharacter);

      expect(result).toEqual(mockBackground.features);
      expect(mockGetBackgroundDefinition).toHaveBeenCalledWith("test-background");
    });

    it("should return empty array for character with non-existent background", () => {
      mockGetBackgroundDefinition.mockReturnValue(null);

      const result = backgroundService.getExpectedFeaturesForCharacter(mockCharacter);

      expect(result).toEqual([]);
      expect(mockGetBackgroundDefinition).toHaveBeenCalledWith("test-background");
    });
  });

  describe("getAvailableBackgrounds", () => {
    it("should return all backgrounds from repository", () => {
      const mockBackgrounds = [mockBackground];
      mockGetAllBackgrounds.mockReturnValue(mockBackgrounds);

      const result = backgroundService.getAvailableBackgrounds();

      expect(result).toEqual(mockBackgrounds);
      expect(mockGetAllBackgrounds).toHaveBeenCalled();
    });

    it("should return empty array when no backgrounds exist", () => {
      mockGetAllBackgrounds.mockReturnValue([]);

      const result = backgroundService.getAvailableBackgrounds();

      expect(result).toEqual([]);
      expect(mockGetAllBackgrounds).toHaveBeenCalled();
    });
  });

  describe("addCustomBackground", () => {
    it("should add custom background to repository", async () => {
      mockAddCustomBackground.mockResolvedValue(undefined);

      await backgroundService.addCustomBackground(mockBackground);

      expect(mockAddCustomBackground).toHaveBeenCalledWith(mockBackground);
    });
  });

  describe("removeCustomBackground", () => {
    it("should remove custom background from repository", async () => {
      mockRemoveCustomBackground.mockResolvedValue(undefined);

      await backgroundService.removeCustomBackground("test-background");

      expect(mockRemoveCustomBackground).toHaveBeenCalledWith("test-background");
    });
  });

  describe("validateBackgroundDefinition", () => {
    it("should return true for valid background", () => {
      const result = backgroundService.validateBackgroundDefinition(mockBackground);

      expect(result).toBe(true);
    });

    it("should return false for background missing id", () => {
      const invalidBackground = { ...mockBackground, id: undefined };

      const result = backgroundService.validateBackgroundDefinition(invalidBackground);

      expect(result).toBe(false);
    });

    it("should return false for background missing name", () => {
      const invalidBackground = { ...mockBackground, name: undefined };

      const result = backgroundService.validateBackgroundDefinition(invalidBackground);

      expect(result).toBe(false);
    });

    it("should return false for background missing description", () => {
      const invalidBackground = { ...mockBackground, description: undefined };

      const result = backgroundService.validateBackgroundDefinition(invalidBackground);

      expect(result).toBe(false);
    });

    it("should return false for background missing features", () => {
      const invalidBackground = { ...mockBackground, features: undefined };

      const result = backgroundService.validateBackgroundDefinition(invalidBackground);

      expect(result).toBe(false);
    });
  });
});
