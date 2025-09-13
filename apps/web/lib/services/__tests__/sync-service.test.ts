import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncStatus, SyncResult } from '@nimble/shared';

// Mock fetch globally
global.fetch = vi.fn();

// Mock the auth service
vi.mock('../auth-service', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    fetchUser: vi.fn(),
  },
}));

// Mock the service factory to return our mocks
vi.mock('../service-factory', () => {
  const mockCharacterStorage = {
    getAllCharacters: vi.fn(),
    replaceAllCharacters: vi.fn(),
  };
  
  const mockCharacterService = {
    getCurrentCharacter: vi.fn(),
    loadCharacter: vi.fn(),
  };
  
  return {
    ServiceFactory: {
      getService: vi.fn((key: string) => {
        if (key === 'characterStorage') {
          return mockCharacterStorage;
        }
        if (key === 'characterService') {
          return mockCharacterService;
        }
        return null;
      }),
    },
    mockCharacterStorage, // Export for test access
    mockCharacterService, // Export for test access
  };
});

// Mock service container keys
vi.mock('../service-container', () => ({
  SERVICE_KEYS: {
    CHARACTER_STORAGE: 'characterStorage',
    CHARACTER_SERVICE: 'characterService',
  },
}));

// Mock the api utils
vi.mock('@/lib/utils/api', () => ({
  apiUrl: 'http://localhost:3001',
}));

// Now import after mocks are set up
import { authService } from '../auth-service';
import { ServiceFactory } from '../service-factory';
import { syncService } from '../sync-service';

describe('SyncService', () => {
  let mockAuthService: any;
  let mockCharacterStorage: any;
  let mockCharacterService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAuthService = authService;
    // Get the mocks from the service factory
    const getServiceMock = ServiceFactory.getService as any;
    mockCharacterStorage = getServiceMock('characterStorage');
    mockCharacterService = getServiceMock('characterService');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('should return true if locally authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      
      const result = await syncService.isAuthenticated();
      
      expect(result).toBe(true);
      expect(mockAuthService.fetchUser).not.toHaveBeenCalled();
    });

    it('should fetch user if not locally authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.fetchUser.mockResolvedValue({ user: { id: 'user-123' } });
      
      const result = await syncService.isAuthenticated();
      
      expect(result).toBe(true);
      expect(mockAuthService.fetchUser).toHaveBeenCalled();
    });

    it('should return false if not authenticated after fetch', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.fetchUser.mockResolvedValue({ user: null });
      
      const result = await syncService.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status from server', async () => {
      const mockStatus: SyncStatus = {
        characterCount: 5,
        lastSyncedAt: Date.now(),
        maxCharacters: 30,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });
      
      const result = await syncService.getSyncStatus();
      
      expect(result).toEqual(mockStatus);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sync/status'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should return null if user is not authenticated', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      const result = await syncService.getSyncStatus();
      
      expect(result).toBeNull();
    });

    it('should handle server errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await syncService.getSyncStatus();
      
      expect(result).toBeNull();
    });
  });

  describe('syncCharacters', () => {
    const mockCharacters = [
      {
        id: 'char-1',
        name: 'Test Character 1',
        timestamps: {
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 5000,
        },
      },
      {
        id: 'char-2',
        name: 'Test Character 2',
        timestamps: {
          createdAt: Date.now() - 20000,
          updatedAt: Date.now() - 1000,
        },
      },
    ];

    it('should sync characters with server', async () => {
      mockCharacterStorage.getAllCharacters.mockResolvedValue(mockCharacters);
      mockCharacterStorage.replaceAllCharacters.mockResolvedValue(undefined);
      mockCharacterService.getCurrentCharacter.mockReturnValue({ id: 'char-1' });
      mockCharacterService.loadCharacter.mockResolvedValue(mockCharacters[0]);
      
      const mockResult: SyncResult = {
        characters: mockCharacters,
        syncedAt: Date.now(),
        characterCount: 2,
        maxCharacters: 30,
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });
      
      // Mock dispatchEvent
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      const result = await syncService.syncCharacters();
      
      expect(result).toEqual(mockResult);
      expect(mockCharacterStorage.getAllCharacters).toHaveBeenCalled();
      expect(mockCharacterStorage.replaceAllCharacters).toHaveBeenCalledWith(mockCharacters);
      expect(mockCharacterService.loadCharacter).toHaveBeenCalledWith('char-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sync/characters'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ characters: mockCharacters }),
        })
      );
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'characters-synced',
        })
      );
    });

    it('should return null if user is not authenticated', async () => {
      mockCharacterStorage.getAllCharacters.mockResolvedValue(mockCharacters);
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      const result = await syncService.syncCharacters();
      
      expect(result).toBeNull();
    });

    it('should throw error for other failures', async () => {
      mockCharacterStorage.getAllCharacters.mockResolvedValue(mockCharacters);
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });
      
      await expect(syncService.syncCharacters()).rejects.toThrow('Server error');
    });
  });

  describe('deleteCharacterBackup', () => {
    it('should delete character backup from server', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
      });
      
      const result = await syncService.deleteCharacterBackup('char-123');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sync/characters/char-123'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });

    it('should return true if character does not exist on server', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      
      const result = await syncService.deleteCharacterBackup('char-123');
      
      expect(result).toBe(true);
    });

    it('should return false for other errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      const result = await syncService.deleteCharacterBackup('char-123');
      
      expect(result).toBe(false);
    });
  });

  describe('formatLastSynced', () => {
    it('should format never synced', () => {
      const result = syncService.formatLastSynced(null);
      expect(result).toBe('Never synced');
    });

    it('should format just now', () => {
      const result = syncService.formatLastSynced(Date.now());
      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      const result = syncService.formatLastSynced(twoMinutesAgo);
      expect(result).toBe('2 minutes ago');
    });

    it('should format hours ago', () => {
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
      const result = syncService.formatLastSynced(threeHoursAgo);
      expect(result).toBe('3 hours ago');
    });

    it('should format days ago', () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const result = syncService.formatLastSynced(twoDaysAgo);
      expect(result).toBe('2 days ago');
    });

    it('should format date for old syncs', () => {
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const result = syncService.formatLastSynced(twoWeeksAgo);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });
});