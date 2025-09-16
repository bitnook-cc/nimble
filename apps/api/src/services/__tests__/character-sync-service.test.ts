import { describe, it, expect, beforeEach, vi, MockedFunction } from "vitest";
import { CharacterSyncService } from "../character-sync-service";
import { isNewerThan } from "@nimble/shared";
import { PrismaClient } from "@prisma/client";

// Mock Prisma Client
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(),
}));

// Mock the shared helper
vi.mock("@nimble/shared", () => ({
  isNewerThan: vi.fn(),
  SyncErrorCode: {
    UNAUTHORIZED: "UNAUTHORIZED",
    MAX_CHARACTERS_EXCEEDED: "MAX_CHARACTERS_EXCEEDED",
    INVALID_CHARACTER_DATA: "INVALID_CHARACTER_DATA",
    SYNC_CONFLICT: "SYNC_CONFLICT",
    SERVER_ERROR: "SERVER_ERROR",
  },
}));

// Mock server config
vi.mock("../../config/server-config", () => ({
  SERVER_CONFIG: {
    sync: {
      maxCharactersPerUser: 30,
    },
  },
}));

// Type for the mocked Prisma client
type MockPrismaClient = {
  characterBackup: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe("CharacterSyncService", () => {
  let service: CharacterSyncService;
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      characterBackup: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    service = new CharacterSyncService(mockPrisma as unknown as PrismaClient);
    vi.clearAllMocks();
  });

  describe("syncCharacters", () => {
    const userId = "user-123";

    it("should sync new characters", async () => {
      const localCharacters = [
        {
          id: "char-1",
          name: "Character 1",
          timestamps: {
            createdAt: Date.now() - 10000,
            updatedAt: Date.now() - 5000,
          },
        },
        {
          id: "char-2",
          name: "Character 2",
          timestamps: {
            createdAt: Date.now() - 20000,
            updatedAt: Date.now() - 1000,
          },
        },
      ];

      mockPrisma.characterBackup.findMany.mockResolvedValue([]);
      mockPrisma.characterBackup.upsert.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: any) =>
        Promise.resolve(ops),
      );

      const result = await service.syncCharacters(userId, localCharacters);

      expect(result.characters).toHaveLength(2);
      expect(result.characterCount).toBe(2);
      expect(result.maxCharacters).toBe(30);
      expect(result.syncedAt).toBeDefined();

      // Verify database operations were prepared
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transactionCall = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionCall).toHaveLength(2);
    });

    it("should merge with existing remote characters", async () => {
      const localCharacter = {
        id: "char-1",
        name: "Local Character",
        timestamps: {
          updatedAt: Date.now() - 5000,
        },
      };

      const remoteCharacter = {
        id: "char-1",
        name: "Remote Character",
        timestamps: {
          updatedAt: Date.now() - 1000,
        },
      };

      const existingBackup = {
        userId,
        characterId: "char-1",
        characterData: remoteCharacter,
        updatedAt: new Date(remoteCharacter.timestamps.updatedAt),
        syncedAt: new Date(),
      };

      mockPrisma.characterBackup.findMany.mockResolvedValue([existingBackup]);
      mockPrisma.$transaction.mockImplementation((ops: any) =>
        Promise.resolve(ops),
      );

      // Mock isNewerThan to say remote is newer
      (isNewerThan as MockedFunction<typeof isNewerThan>).mockReturnValue(false);

      const result = await service.syncCharacters(userId, [localCharacter]);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]).toEqual(remoteCharacter);

      // Should not update database since remote is newer
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("should update remote when local is newer", async () => {
      const localCharacter = {
        id: "char-1",
        name: "Local Character",
        timestamps: {
          updatedAt: Date.now(),
        },
      };

      const remoteCharacter = {
        id: "char-1",
        name: "Remote Character",
        timestamps: {
          updatedAt: Date.now() - 10000,
        },
      };

      const existingBackup = {
        userId,
        characterId: "char-1",
        characterData: remoteCharacter,
        updatedAt: new Date(remoteCharacter.timestamps.updatedAt),
        syncedAt: new Date(),
      };

      mockPrisma.characterBackup.findMany.mockResolvedValue([existingBackup]);
      mockPrisma.characterBackup.upsert.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: any) =>
        Promise.resolve(ops),
      );

      // Mock isNewerThan to say local is newer
      (isNewerThan as MockedFunction<typeof isNewerThan>).mockReturnValue(true);

      const result = await service.syncCharacters(userId, [localCharacter]);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]).toEqual(localCharacter);

      // Should update database since local is newer
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transactionCall = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionCall).toHaveLength(1);
    });

    it("should include remote-only characters in result", async () => {
      const localCharacter = {
        id: "char-1",
        timestamps: {
          updatedAt: Date.now(),
        },
      };

      const remoteOnlyCharacter = {
        id: "char-2",
        name: "Remote Only",
        timestamps: {
          updatedAt: Date.now() - 5000,
        },
      };

      const existingBackup = {
        userId,
        characterId: "char-2",
        characterData: remoteOnlyCharacter,
        updatedAt: new Date(remoteOnlyCharacter.timestamps.updatedAt),
        syncedAt: new Date(),
      };

      mockPrisma.characterBackup.findMany.mockResolvedValue([existingBackup]);
      mockPrisma.characterBackup.upsert.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: any) =>
        Promise.resolve(ops),
      );

      const result = await service.syncCharacters(userId, [localCharacter]);

      expect(result.characters).toHaveLength(2);
      expect(result.characters).toContainEqual(localCharacter);
      expect(result.characters).toContainEqual(remoteOnlyCharacter);
    });

    it("should enforce character limit", async () => {
      const tooManyCharacters = Array.from({ length: 31 }, (_, i) => ({
        id: `char-${i}`,
        timestamps: {
          updatedAt: Date.now(),
        },
      }));

      mockPrisma.characterBackup.findMany.mockResolvedValue([]);

      await expect(
        service.syncCharacters(userId, tooManyCharacters),
      ).rejects.toThrow("Character limit exceeded");
    });

    it("should skip characters without id or updatedAt", async () => {
      const characters = [
        {
          id: "char-1",
          timestamps: {
            updatedAt: Date.now(),
          },
        },
        {
          // Missing id
          timestamps: {
            updatedAt: Date.now(),
          },
        },
        {
          id: "char-3",
          // Missing timestamps
        },
      ];

      mockPrisma.characterBackup.findMany.mockResolvedValue([]);
      mockPrisma.characterBackup.upsert.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: any) =>
        Promise.resolve(ops),
      );

      const result = await service.syncCharacters(userId, characters);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].id).toBe("char-1");
    });

    it("should handle invalid input", async () => {
      await expect(service.syncCharacters(userId, null as unknown as any[])).rejects.toThrow(
        "Invalid request: characters must be an array",
      );
    });
  });

  describe("getSyncStatus", () => {
    const userId = "user-123";

    it("should return sync status", async () => {
      const mockLastBackup = {
        syncedAt: new Date("2024-01-01T12:00:00Z"),
      };

      mockPrisma.characterBackup.count.mockResolvedValue(5);
      mockPrisma.characterBackup.findFirst.mockResolvedValue(mockLastBackup);

      const result = await service.getSyncStatus(userId);

      expect(result.characterCount).toBe(5);
      expect(result.lastSyncedAt).toBe(mockLastBackup.syncedAt.getTime());
      expect(result.maxCharacters).toBe(30);
    });

    it("should return null for lastSyncedAt if no backups exist", async () => {
      mockPrisma.characterBackup.count.mockResolvedValue(0);
      mockPrisma.characterBackup.findFirst.mockResolvedValue(null);

      const result = await service.getSyncStatus(userId);

      expect(result.characterCount).toBe(0);
      expect(result.lastSyncedAt).toBeNull();
      expect(result.maxCharacters).toBe(30);
    });
  });

  describe("deleteCharacterBackup", () => {
    const userId = "user-123";
    const characterId = "char-1";

    it("should delete character backup", async () => {
      mockPrisma.characterBackup.delete.mockResolvedValue({
        userId,
        characterId,
      });

      await service.deleteCharacterBackup(userId, characterId);

      expect(mockPrisma.characterBackup.delete).toHaveBeenCalledWith({
        where: {
          userId_characterId: {
            userId,
            characterId,
          },
        },
      });
    });

    it("should throw error if deletion fails", async () => {
      mockPrisma.characterBackup.delete.mockRejectedValue(
        new Error("Not found"),
      );

      await expect(
        service.deleteCharacterBackup(userId, characterId),
      ).rejects.toThrow("Not found");
    });
  });
});
