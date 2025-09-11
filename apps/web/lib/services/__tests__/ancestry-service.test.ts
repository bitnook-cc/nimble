import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AncestryService } from '../ancestry-service';
import type { AncestryDefinition } from '@/lib/schemas/ancestry';
import type { Character } from '@/lib/schemas/character';
import type { CharacterFeature } from '@/lib/schemas/features';

// Create mock functions
const mockGetAncestryDefinition = vi.fn();
const mockGetAllAncestries = vi.fn();
const mockAddCustomAncestry = vi.fn();
const mockRemoveCustomAncestry = vi.fn();

// Mock ContentRepositoryService
vi.mock('../content-repository-service', () => ({
  ContentRepositoryService: {
    getInstance: vi.fn(() => ({
      getAncestryDefinition: mockGetAncestryDefinition,
      getAllAncestries: mockGetAllAncestries,
      addCustomAncestry: mockAddCustomAncestry,
      removeCustomAncestry: mockRemoveCustomAncestry
    }))
  }
}));

describe('AncestryService', () => {
  let ancestryService: AncestryService;

  const mockAncestry: AncestryDefinition = {
    id: 'test-ancestry',
    name: 'Test Ancestry',
    description: 'A test ancestry',
    size: 'medium',
    rarity: 'common',
    features: [
      {
        id: 'test-feature',
        name: 'Test Feature',
        description: 'A test feature',
        effects: [
          {
            id: 'test-effect-1',
            type: 'attribute_boost',
            allowedAttributes: ['strength'],
            amount: 2
          }
        ]
      }
    ]
  };

  const mockCharacter = {
    id: 'test-char',
    name: 'Test Character',
    level: 1,
    classId: 'fighter',
    ancestryId: 'test-ancestry',
    backgroundId: 'test-background'
  } as Character;

  beforeEach(() => {
    vi.clearAllMocks();
    ancestryService = new AncestryService();
  });

  describe('getCharacterAncestry', () => {
    it('should return ancestry definition for a character', () => {
      mockGetAncestryDefinition.mockReturnValue(mockAncestry);

      const result = ancestryService.getCharacterAncestry(mockCharacter);

      expect(result).toEqual(mockAncestry);
      expect(mockGetAncestryDefinition).toHaveBeenCalledWith('test-ancestry');
    });

    it('should return null for character with non-existent ancestry', () => {
      mockGetAncestryDefinition.mockReturnValue(null);

      const result = ancestryService.getCharacterAncestry(mockCharacter);

      expect(result).toBeNull();
      expect(mockGetAncestryDefinition).toHaveBeenCalledWith('test-ancestry');
    });
  });

  describe('getExpectedFeaturesForCharacter', () => {
    it('should return features for character with ancestry', () => {
      mockGetAncestryDefinition.mockReturnValue(mockAncestry);

      const result = ancestryService.getExpectedFeaturesForCharacter(mockCharacter);

      expect(result).toEqual(mockAncestry.features);
      expect(mockGetAncestryDefinition).toHaveBeenCalledWith('test-ancestry');
    });

    it('should return empty array for character with non-existent ancestry', () => {
      mockGetAncestryDefinition.mockReturnValue(null);

      const result = ancestryService.getExpectedFeaturesForCharacter(mockCharacter);

      expect(result).toEqual([]);
      expect(mockGetAncestryDefinition).toHaveBeenCalledWith('test-ancestry');
    });
  });

  describe('getAvailableAncestries', () => {
    it('should return all ancestries from repository', () => {
      const mockAncestries = [mockAncestry];
      mockGetAllAncestries.mockReturnValue(mockAncestries);

      const result = ancestryService.getAvailableAncestries();

      expect(result).toEqual(mockAncestries);
      expect(mockGetAllAncestries).toHaveBeenCalled();
    });

    it('should return empty array when no ancestries exist', () => {
      mockGetAllAncestries.mockReturnValue([]);

      const result = ancestryService.getAvailableAncestries();

      expect(result).toEqual([]);
      expect(mockGetAllAncestries).toHaveBeenCalled();
    });
  });

  describe('addCustomAncestry', () => {
    it('should add custom ancestry to repository', async () => {
      mockAddCustomAncestry.mockResolvedValue(undefined);

      await ancestryService.addCustomAncestry(mockAncestry);

      expect(mockAddCustomAncestry).toHaveBeenCalledWith(mockAncestry);
    });
  });

  describe('removeCustomAncestry', () => {
    it('should remove custom ancestry from repository', async () => {
      mockRemoveCustomAncestry.mockResolvedValue(undefined);

      await ancestryService.removeCustomAncestry('test-ancestry');

      expect(mockRemoveCustomAncestry).toHaveBeenCalledWith('test-ancestry');
    });
  });
});