import { describe, expect, it, vi } from "vitest";

import { characterSchema } from "../../schemas/character";
import { mergeWithDefaultCharacter } from "../../utils/character-defaults";
import {
  characterFingerprint,
  mergeSyncResponse,
  serializeCharacter,
} from "../../utils/character-serialization";
import { CharacterStorageService } from "../character-storage-service";
import { InMemoryStorageService } from "../storage-service";

const make = (id = "b2423420-6589-4aee-8b0c-577637e7073a") =>
  characterSchema.parse(
    mergeWithDefaultCharacter(
      {
        name: "Hero",
        ancestryId: "human",
        backgroundId: "fearless",
        classId: "berserker",
        _spellScalingLevel: 1,
      },
      id,
    ),
  );
describe("sync data integrity", () => {
  it("advances revisions for rapid edits from an older in-memory character", async () => {
    const storage = new InMemoryStorageService();
    const service = new CharacterStorageService(storage);
    const character = await service.createCharacter(make());
    const clock = vi.spyOn(Date, "now").mockReturnValue(character.timestamps!.updatedAt!);
    try {
      await service.updateCharacter({ ...character, name: "First edit" });
      const first = (await service.getCharacter(character.id))!.timestamps!.updatedAt!;
      await service.updateCharacter({ ...character, name: "Second edit" });
      expect((await service.getCharacter(character.id))!.timestamps!.updatedAt).toBeGreaterThan(
        first,
      );
    } finally {
      clock.mockRestore();
    }
  });
  it("preserves resource counters through JSON and detects counter-only edits", () => {
    const character = make();
    character._abilityUses.set("rage", 2);
    character._resourceValues.set("mana", { type: "numerical", value: 7 });
    const restored = characterSchema.parse(
      JSON.parse(JSON.stringify(serializeCharacter(character))),
    );
    expect(restored._abilityUses.get("rage")).toBe(2);
    expect(restored._resourceValues.get("mana")?.value).toBe(7);
    const before = characterFingerprint(character);
    character._abilityUses.set("rage", 3);
    expect(characterFingerprint(character)).not.toBe(before);
  });
  it("preserves edits, additions, and deletions made while syncing", () => {
    const sent = make();
    const deleted = make("33cfcfbb-8eaf-4e1e-aa35-a7f704875094");
    const added = make("36af695a-0af0-46d7-8154-a99c464aeeef");
    const edited = { ...sent, name: "Edited while waiting" };
    const result = mergeSyncResponse([sent, deleted], [sent, deleted], [edited, added]);
    expect(result).toEqual([edited, added]);
  });
  it("reading and switching characters do not modify their timestamps", async () => {
    const storage = new InMemoryStorageService();
    const service = new CharacterStorageService(storage);
    const character = await service.createCharacter(make());
    const before = storage.getItem("sheets-characters");
    await service.getAllCharacters();
    await service.getCharacter(character.id);
    await service.updateLastPlayed(character.id);
    expect(storage.getItem("sheets-characters")).toBe(before);
  });
  it("rejects a malformed remote collection before overwriting local data", async () => {
    const storage = new InMemoryStorageService();
    const service = new CharacterStorageService(storage);
    const character = await service.createCharacter(make());
    const before = storage.getItem("sheets-characters");
    await expect(
      service.mergeSyncedCharacters([character], [{ ...character, id: "invalid" }]),
    ).rejects.toThrow();
    expect(storage.getItem("sheets-characters")).toBe(before);
  });
  it("propagates failed writes and preserves the existing collection", async () => {
    const storage = new InMemoryStorageService();
    const service = new CharacterStorageService(storage);
    const character = await service.createCharacter(make());
    const before = storage.getItem("sheets-characters");
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    await expect(service.replaceAllCharacters([{ ...character, name: "Changed" }])).rejects.toThrow(
      "quota",
    );
    expect(storage.getItem("sheets-characters")).toBe(before);
  });
});

describe("campaign inventory review", () => {
  it("accepts cloud inventory while retaining current character edits and revision", async () => {
    const storage = new InMemoryStorageService();
    const service = new CharacterStorageService(storage);
    const character = await service.createCharacter(make());
    await service.updateCharacter({ ...character, name: "Local name edit", notes: [] });
    const inventory = { ...character.inventory, items: [], currency: { gold: 12 } };
    await service.acceptCampaignInventory(character.id, inventory, 2);
    const saved = (await service.getCharacter(character.id))!;
    expect(saved.name).toBe("Local name edit");
    expect(saved.inventory.currency.gold).toBe(12);
    expect(saved._inventoryRevision).toBe(2);
    await expect(
      service.acceptCampaignInventory(character.id, character.inventory, 1),
    ).rejects.toThrow("changed again");
    expect((await service.getCharacter(character.id))!.inventory.currency.gold).toBe(12);
  });
});
