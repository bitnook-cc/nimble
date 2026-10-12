import { describe, it, expect, vi } from "vitest";
import { AuthService } from "../auth-service.js";
import type { PrismaClient } from "@prisma/client";
import type { IronSession } from "iron-session";
import type { SessionData } from "../../config/session.js";
describe("verified API identities", () => {
  it.each([null, { id: "different-account" }])(
    "rejects deleted or mismatched accounts",
    async (result) => {
      const findUnique = vi.fn().mockResolvedValue(result);
      const service = new AuthService({
        user: { findUnique },
      } as unknown as PrismaClient);
      const session = {
        user: { id: "account", googleId: "google" },
        destroy: vi.fn(),
      } as unknown as IronSession<SessionData>;
      expect(await service.ensureUserExists(session)).toBeNull();
      expect(session.destroy).toHaveBeenCalled();
    },
  );
  it("fails closed if the database identity lookup fails", async () => {
    const service = new AuthService({
      user: { findUnique: vi.fn().mockRejectedValue(new Error("offline")) },
    } as unknown as PrismaClient);
    expect(
      await service.ensureUserExists({
        user: { id: "account", googleId: "google" },
      } as IronSession<SessionData>),
    ).toBeNull();
  });
});
