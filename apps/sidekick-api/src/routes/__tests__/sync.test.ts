import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import {
  CharacterSyncService,
  LegacyInventoryConflictError,
} from "../../services/character-sync-service.js";
import { SYNC_PROTOCOL_VERSION } from "@nimble/shared";

vi.mock("../../config/session.js", () => ({ sessionOptions: {} }));
vi.mock("iron-session", () => ({
  getIronSession: async () => ({
    user: { id: "owner", email: "owner@example.test" },
  }),
}));
vi.mock("../../services/auth-service.js", () => ({
  AuthService: class {
    async ensureUserExists() {
      return { id: "owner" };
    }
  },
}));
import router from "../sync.js";

let server: Server;
let baseUrl: string;
const sync = vi.spyOn(CharacterSyncService.prototype, "syncCharacters");
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/sync", router);
  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test server address");
  baseUrl = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  sync.mockRestore();
});
beforeEach(() => {
  sync.mockReset().mockResolvedValue({
    characters: [],
    characterCount: 0,
    maxCharacters: 30,
    syncedAt: Date.now(),
  });
});
function post(body: object) {
  return fetch(`${baseUrl}/sync/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
it("negotiates inventory conflict support only for the current protocol", async () => {
  expect((await post({ characters: [] })).status).toBe(200);
  expect(sync).toHaveBeenLastCalledWith("owner", [], false);
  expect(
    (await post({ characters: [], protocolVersion: SYNC_PROTOCOL_VERSION }))
      .status,
  ).toBe(200);
  expect(sync).toHaveBeenLastCalledWith("owner", [], true);
});
it("rejects legacy inventory conflicts without a success snapshot", async () => {
  sync.mockRejectedValue(new LegacyInventoryConflictError());
  const response = await post({ characters: [] });
  expect(response.status).toBe(409);
  const body = await response.json();
  expect(body).toMatchObject({
    code: "SYNC_CONFLICT",
    error: expect.stringContaining("Update Sidekick"),
  });
  expect(body).not.toHaveProperty("characters");
});
it("rejects a changed account before syncing", async () => {
  const response = await post({
    characters: [],
    accountId: "different-owner",
    protocolVersion: SYNC_PROTOCOL_VERSION,
  });
  expect(response.status).toBe(409);
  expect(sync).not.toHaveBeenCalled();
});
