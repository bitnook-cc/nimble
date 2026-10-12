import { beforeEach, it, expect, vi } from "vitest";
const { getUser, getSession } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock("../supabase/server", () => ({
  createClient: async () => ({ auth: { getUser, getSession } }),
}));
import { getUserTags } from "../access";
beforeEach(() => vi.clearAllMocks());
it("never authorizes a forged locally decoded session", async () => {
  getSession.mockResolvedValue({
    data: { session: { user: { app_metadata: { tags: ["test"] } } } },
  });
  getUser.mockResolvedValue({
    data: { user: null },
    error: new Error("invalid token"),
  });
  expect(await getUserTags()).toEqual([]);
  expect(getSession).not.toHaveBeenCalled();
});
it("expires membership tags while preserving independent purchases", async () => {
  getUser.mockResolvedValue({
    data: {
      user: {
        app_metadata: {
          tags: ["patron", "patreon-tier-3", "book-1"],
          patreon_membership_expires_at: new Date(0).toISOString(),
        },
      },
    },
  });
  expect(await getUserTags()).toEqual(["book-1"]);
});
it("accepts freshly verified membership tags", async () => {
  getUser.mockResolvedValue({
    data: {
      user: {
        app_metadata: {
          tags: ["patron"],
          patreon_membership_expires_at: new Date(
            Date.now() + 60000,
          ).toISOString(),
        },
      },
    },
  });
  expect(await getUserTags()).toEqual(["patron"]);
});
