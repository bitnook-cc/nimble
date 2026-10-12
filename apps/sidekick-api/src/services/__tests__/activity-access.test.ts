import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  members: vi.fn(),
  logs: vi.fn(),
  remove: vi.fn(),
  trigger: vi.fn(),
}));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    gameSession = { findUnique: mocks.findUnique, findFirst: mocks.findFirst };
    sessionParticipant = { findMany: mocks.members, delete: mocks.remove };
    sharedActivityLog = { findMany: mocks.logs };
  },
}));
vi.mock("../../lib/pusher.js", () => ({ pusher: { trigger: mocks.trigger } }));
import { ActivitySharingService } from "../activity-sharing-service.js";
const service = new ActivitySharingService();
beforeEach(() => vi.clearAllMocks());
describe("session membership boundaries", () => {
  it("denies session details to another authenticated account", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "session",
      ownerId: "owner",
      participants: [{ userId: "member" }],
    });
    await expect(service.getSession("session", "outsider")).rejects.toThrow(
      "Session access denied",
    );
  });
  it("denies history before reading any activity", async () => {
    mocks.findUnique.mockResolvedValue({ id: "session" });
    mocks.findFirst.mockResolvedValue(null);
    await expect(
      service.getActivityLog("session", "removed-user"),
    ).rejects.toThrow("Session access denied");
    expect(mocks.logs).not.toHaveBeenCalled();
  });
  it("requires active membership for private channel authorization", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(
      service.requireSessionAccess("session", "outsider", true),
    ).rejects.toThrow("Session access denied");
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "session",
          isActive: true,
          OR: [
            { ownerId: "outsider" },
            { participants: { some: { userId: "outsider" } } },
          ],
        },
      }),
    );
  });
  it("sends the removal notification on private channels only", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "session",
      ownerId: "owner",
      participants: [{ id: "participant", userId: "removed" }],
    });
    mocks.members.mockResolvedValue([{ userId: "remaining" }]);
    await service.removeParticipant("owner", "session", "participant");
    expect(mocks.trigger).toHaveBeenCalledWith(
      [
        "private-session-session-user-owner",
        "private-session-session-user-remaining",
        "private-session-session-user-removed",
      ],
      "participant-removed",
      expect.any(Object),
    );
  });
});
