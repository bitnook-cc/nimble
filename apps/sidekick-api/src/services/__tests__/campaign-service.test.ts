import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { campaigns } from "@nimble/shared";
import { CampaignService } from "../campaign-service.js";
import { CharacterSyncService } from "../character-sync-service.js";

vi.mock("@vercel/analytics/server", () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));
// In-memory PostgreSQL runs the real migration SQL and Prisma queries. The socket
// multiplexer serializes connections; production lock contention needs PostgreSQL CI.
describe("campaign persistence and access", () => {
  let db: PGlite,
    socket: PGLiteSocketServer,
    prisma: PrismaClient,
    service: CampaignService;
  let campaignId: string,
    player: string,
    owner: string,
    outsider: string,
    characterId: string;
  beforeAll(async () => {
    db = await PGlite.create();
    const migrations = new URL("../../../prisma/migrations/", import.meta.url);
    for (const directory of (await readdir(migrations, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))) {
      await db.exec(
        await readFile(
          new URL(`${directory.name}/migration.sql`, migrations),
          "utf8",
        ),
      );
    }
    socket = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 0 });
    await socket.start();
    prisma = new PrismaClient({
      datasourceUrl: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres?connection_limit=1`,
    });
    service = new CampaignService(prisma);
    await prisma.$connect();
  }, 60000);
  afterAll(async () => {
    await prisma?.$disconnect();
    await socket?.stop();
    await db?.close();
  });
  beforeEach(async () => {
    const users = await Promise.all(
      ["Owner", "Player", "Outsider"].map((name) =>
        prisma.user.create({
          data: { googleId: randomUUID(), email: `${name}@example.test`, name },
        }),
      ),
    );
    [owner, player, outsider] = users.map((u) => u.id);
    campaignId = (await service.create(owner, { name: "Test campaign" })).id;
    const invite = await service.invite(campaignId, owner, {
      days: 7,
      maxUses: 10,
      expectedRevision: 0,
    });
    await service.join(player, invite.token);
    characterId = randomUUID();
    await prisma.characterBackup.create({
      data: {
        userId: player,
        characterId,
        updatedAt: new Date(),
        characterData: {
          id: characterId,
          name: "Hero",
          notes: [{ content: "Private diary" }],
          timestamps: { updatedAt: Date.now() },
          inventory: {
            maxSize: 10,
            currency: { gold: 20 },
            items: [
              {
                id: "potion",
                name: "Potion",
                type: "consumable",
                size: 1,
                count: 5,
              },
            ],
          },
        },
      },
    });
    await mutate(player, { type: "attach", characterId, shareNotes: false });
  });
  const mutate = async (actor: string, command: campaigns.Command) =>
    service.mutate(campaignId, actor, {
      operationId: randomUUID(),
      expectedRevision: (await service.view(campaignId, actor)).revision,
      command,
    });
  it("hides campaigns from nonmembers and denies player GM commands", async () => {
    await expect(service.view(campaignId, outsider)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.authorize(campaignId, outsider)).rejects.toMatchObject(
      { status: 404 },
    );
    await expect(
      service.mutate(campaignId, outsider, {
        operationId: randomUUID(),
        expectedRevision: 0,
        command: { type: "settings", name: "Hijacked", description: "" },
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      mutate(player, { type: "settings", name: "Hijacked", description: "" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      mutate(player, {
        type: "attach",
        characterId: "not-owned",
        shareNotes: false,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("lets GMs read sheets but keeps private notes private until opt-in", async () => {
    expect(
      (await service.view(campaignId, owner)).members.find(
        (m) => m.userId === player,
      )?.character,
    ).not.toHaveProperty("notes");
    await mutate(player, { type: "attach", characterId, shareNotes: true });
    expect(
      (await service.view(campaignId, owner)).members.find(
        (m) => m.userId === player,
      )?.character,
    ).toHaveProperty("notes");
    await mutate(owner, { type: "member", userId: player, action: "remove" });
    await expect(service.view(campaignId, player)).rejects.toMatchObject({
      status: 404,
    });
  });
  it("requires the owner to grant GM privileges and protects the owner", async () => {
    await expect(
      mutate(player, { type: "member", userId: player, action: "GM" }),
    ).rejects.toMatchObject({ status: 403 });
    await mutate(owner, { type: "member", userId: player, action: "GM" });
    await expect(
      mutate(player, { type: "member", userId: owner, action: "remove" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      mutate(player, { type: "member", userId: owner, action: "PLAYER" }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("enforces expiration, revocation and invite capacity", async () => {
    const revision = (await service.view(campaignId, owner)).revision;
    const invite = await service.invite(campaignId, owner, {
      days: 1,
      maxUses: 1,
      expectedRevision: revision,
    });
    await service.join(outsider, invite.token);
    const other = await prisma.user.create({
      data: {
        name: "Other",
        email: "other@example.test",
        googleId: randomUUID(),
      },
    });
    await expect(service.join(other.id, invite.token)).rejects.toMatchObject({
      status: 410,
    });
    const next = await service.invite(campaignId, owner, {
      days: 1,
      maxUses: 1,
      expectedRevision: (await service.view(campaignId, owner)).revision,
    });
    await prisma.campaignInvite.updateMany({
      where: { campaignId },
      data: { expiresAt: new Date(0) },
    });
    await expect(service.join(other.id, next.token)).rejects.toMatchObject({
      status: 410,
    });
    const revoked = await service.invite(campaignId, owner, {
      days: 1,
      maxUses: 1,
      expectedRevision: (await service.view(campaignId, owner)).revision,
    });
    const newest = await prisma.campaignInvite.findFirstOrThrow({
      where: { campaignId },
      orderBy: { expiresAt: "desc" },
    });
    await service.revoke(campaignId, owner, newest.id);
    await expect(service.join(other.id, revoked.token)).rejects.toMatchObject({
      status: 410,
    });
  });
  it("makes item transfers atomic and retries idempotent, rejecting stale writes", async () => {
    const command: campaigns.Command = {
      type: "transfer",
      direction: "deposit",
      userId: player,
      itemId: "potion",
      quantity: 3,
      inventoryRevision: 0,
    };
    const mutation = {
      operationId: randomUUID(),
      expectedRevision: (await service.view(campaignId, player)).revision,
      command,
    };
    await service.mutate(campaignId, player, mutation);
    await service.mutate(campaignId, player, mutation);
    const snapshot = await service.view(campaignId, player);
    expect(snapshot.state.items).toHaveLength(1);
    expect(snapshot.state.items[0].quantity).toBe(3);
    const backup = await prisma.characterBackup.findUniqueOrThrow({
      where: { userId_characterId: { userId: player, characterId } },
    });
    expect(backup.inventoryRevision).toBe(1);
    expect(
      (backup.characterData as { inventory: { items: { count: number }[] } })
        .inventory.items[0].count,
    ).toBe(2);
    await expect(
      service.mutate(campaignId, player, {
        ...mutation,
        command: { ...command, quantity: 1 },
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      service.mutate(campaignId, player, {
        ...mutation,
        operationId: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      mutate(player, { ...command, quantity: 99, inventoryRevision: 1 }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await service.view(campaignId, player)).revision).toBe(
      snapshot.revision,
    );
  });
  it("accepts only one of two claims prepared against the same revision", async () => {
    await mutate(owner, {
      type: "stash",
      entry: {
        id: "single",
        item: {
          id: "sword",
          name: "Sword",
          type: "weapon",
          size: 1,
          damage: "d6",
        },
        quantity: 1,
        location: "Party",
        hidden: false,
      },
    });
    const revision = (await service.view(campaignId, player)).revision;
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        service.mutate(campaignId, player, {
          operationId: randomUUID(),
          expectedRevision: revision,
          command: {
            type: "transfer",
            direction: "claim",
            userId: player,
            itemId: "single",
            quantity: 1,
            inventoryRevision: 0,
          },
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await service.view(campaignId, player)).state.items).toHaveLength(
      0,
    );
  });
  it("blocks stale character sync from recreating transferred items", async () => {
    const before = await prisma.characterBackup.findUniqueOrThrow({
      where: { userId_characterId: { userId: player, characterId } },
    });
    await mutate(player, {
      type: "transfer",
      direction: "deposit",
      userId: player,
      itemId: "potion",
      quantity: 3,
      inventoryRevision: 0,
    });
    const stale = {
      ...(before.characterData as object),
      id: characterId,
      timestamps: { updatedAt: Date.now() + 1000 },
    };
    const sync = new CharacterSyncService(prisma);
    await expect(
      sync.syncCharacters(
        player,
        [{ ...stale, notes: [{ content: "New local edit" }] }],
        false,
      ),
    ).rejects.toThrow("Update Sidekick");
    const cloudAfterRejection = await prisma.characterBackup.findUniqueOrThrow({
      where: { userId_characterId: { userId: player, characterId } },
    });
    expect(
      (
        cloudAfterRejection.characterData as {
          inventory: { items: { count: number }[] };
        }
      ).inventory.items[0].count,
    ).toBe(2);
    const result = await sync.syncCharacters(player, [stale]);
    expect(result.inventoryConflicts).toEqual([characterId]);
    expect(result.characters[0].inventory.items[0].count).toBe(2);
    expect(result.characters[0]._inventoryRevision).toBe(1);
  });
  it("does not let players claim hidden items or spend someone else's currency", async () => {
    await mutate(owner, {
      type: "stash",
      entry: {
        id: "hidden",
        item: { id: "gem", name: "Secret gem", type: "freeform", size: 0 },
        quantity: 1,
        location: "GM",
        hidden: true,
      },
    });
    expect((await service.view(campaignId, player)).state.items).toHaveLength(
      0,
    );
    await expect(
      mutate(player, {
        type: "transfer",
        direction: "claim",
        userId: player,
        itemId: "hidden",
        quantity: 1,
        inventoryRevision: 0,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      mutate(owner, {
        type: "currency",
        direction: "deposit",
        userId: player,
        currency: "gold",
        amount: 1,
        inventoryRevision: 0,
      }),
    ).rejects.toMatchObject({ status: 403 });
    await mutate(player, {
      type: "currency",
      direction: "deposit",
      userId: player,
      currency: "gold",
      amount: 5,
      inventoryRevision: 0,
    });
    expect((await service.view(campaignId, player)).state.treasury.gold).toBe(
      5,
    );
    await expect(
      mutate(player, {
        type: "currency",
        direction: "claim",
        userId: player,
        currency: "gold",
        amount: 6,
        inventoryRevision: 1,
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await service.view(campaignId, player)).state.treasury.gold).toBe(
      5,
    );
  });
});
