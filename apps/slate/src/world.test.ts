import "fake-indexeddb/auto";
import { IDBObjectStore } from "fake-indexeddb";
import { afterEach, expect, it, vi } from "vitest";
import {
  documentReferences,
  readDocument,
  writeDocument,
  mapDocumentTargets,
  removeDocumentReference,
  markdownForDisplay,
  updateDocumentReference,
} from "./document-markdown";
import { referenceMarkdown, referenceHref, readReference } from "./references";
import { RelationshipCache } from "./relationship-cache";
import { newNote, updateNote } from "./notes";
import { newApp, campaignSchema, SCHEMA_VERSION } from "./model";
import { createWorldScreen, duplicateScreen } from "./screens";
import { copyCampaign } from "./campaigns";
import { encodeBackup, decodeBackup } from "./backup";
import { exportRecords, applyExchange } from "./exchange";
import { prepareContentImport } from "./content-import";
import { entries } from "./content";
import { migrateApp } from "./migrations";

const caches: RelationshipCache[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(caches.splice(0).map((cache) => cache.close()));
});
const cache = (name = crypto.randomUUID()) => {
  const instance = new RelationshipCache(name);
  caches.push(instance);
  return instance;
};
const source = "local::mara";
function markdown() {
  return writeDocument(
    "Mara serves " +
      referenceMarkdown("the Court", "local::court#members", ["member-of"]) +
      ".\n@court:secret\n",
    {
      title: "Mara",
      category: "Person",
      tags: ["npc"],
      relationships: [
        { target: "court", tags: ["member-of"] },
        { target: "local::court", tags: ["owes-money", "secret"] },
      ],
      custom: { preserve: true },
    },
  );
}

it("unions separate header and inline declarations without collapsing targets or tag sets", () => {
  const parsed = documentReferences(markdown(), source);
  expect(parsed.errors).toEqual([]);
  expect(parsed.references).toHaveLength(4);
  expect(
    parsed.references.map((row) => [row.origin, row.target, row.tags]),
  ).toEqual([
    ["header", "local::court", ["member-of"]],
    ["header", "local::court", ["owes-money", "secret"]],
    ["inline", "local::court#members", ["member-of"]],
    ["inline", "local::court", ["secret"]],
  ]);
  expect(
    readDocument(markdown()).relationships.every((row) => !("id" in row)),
  ).toBe(true);
});

it("parses Markdown links and definitions while ignoring code, HTML, images, escaped mentions and email addresses", () => {
  const body =
    "`@ignored:tag`\n\n```md\n@ignored:tag\n```\n\n\\@escaped:tag alice@example.com\n\n" +
    referenceMarkdown("Court", "local::court", [
      "some free-form tag",
      "secret",
    ]) +
    "\n\n[Court][court]\n\n[court]: slate:local%3A%3Acourt\n\n![not a reference](slate:local%3A%3Aimage)\n\n\\* text @real:tag";
  const refs = documentReferences(body, source).references;
  expect(refs.map((row) => row.target)).toEqual([
    "local::court",
    "local::court",
    "local::real",
  ]);
  expect(body.slice(refs.at(-1)!.start, refs.at(-1)!.end)).toBe("@real:tag");
  expect(refs[0].tags).toEqual(["some free-form tag", "secret"]);
  expect(markdownForDisplay(body)).toContain(
    "[real](slate:local::real?tag=tag)",
  );
  expect(markdownForDisplay(body)).toContain("`@ignored:tag`");
});

it("writes readable reference colons, accepts existing encoded links, and edits one declaration safely", () => {
  expect(referenceHref("local::mara")).toBe("slate:local::mara");
  expect(readReference("slate:local%3A%3Amara")).toEqual({
    target: "local::mara",
    tags: [],
  });
  const target = "pack@1::a path(with parentheses)?#section";
  expect(readReference(referenceHref(target))?.target).toBe(target);
  expect(referenceHref(target)).not.toContain(" ");
  const legacy = writeDocument(
    "Visit [the Court](slate:local%3A%3Acourt?tag=secret).",
    { relationships: [{ target: "court", tags: ["ally"] }] },
  );
  const reference = documentReferences(legacy, source).references[1];
  const changed = updateDocumentReference(legacy, reference, {
    target: "local::harbour",
    label: "the docks",
  });
  expect(changed).toContain("[the docks](slate:local::harbour?tag=secret)");
  expect(readDocument(changed).relationships).toEqual([
    { target: "court", tags: ["ally"] },
  ]);
  expect(() =>
    updateDocumentReference("Changed\n" + legacy, reference, { label: "Oops" }),
  ).toThrow("references changed");
});

it("preserves free-form tags, anchors and unknown metadata through remapping and safe unlinking", () => {
  const href = referenceHref("local::court#members", [
    "member of",
    "secret",
    "secret",
    "colon:tag",
  ]);
  expect(readReference(href)).toEqual({
    target: "local::court#members",
    tags: ["member of", "secret", "colon:tag"],
  });
  const mapped = mapDocumentTargets(markdown(), (target) =>
    target.replace("local::court", "local::new-court"),
  );
  expect(
    documentReferences(mapped, source).references.every((row) =>
      row.target.startsWith("local::new-court"),
    ),
  ).toBe(true);
  expect(readDocument(mapped).metadata.custom).toEqual({ preserve: true });
  const ref = documentReferences(markdown(), source).references[2];
  const unlinked = removeDocumentReference(markdown(), ref);
  expect(unlinked).toContain("Mara serves the Court.");
  expect(documentReferences(unlinked, source).references).toHaveLength(3);
  expect(() => removeDocumentReference("Changed\n" + markdown(), ref)).toThrow(
    "references changed",
  );
  expect(
    documentReferences("@court:tag", "pack@1::mara").references[0].target,
  ).toBe("pack@1::court");
});

it("projects note metadata from Markdown, writes control changes into the header, and preserves malformed source", () => {
  const campaign = newApp().campaigns[0];
  campaign.content.push({ ...newNote("Mara", "mara"), body: markdown() });
  const next = updateNote(campaign, "mara", (note) => ({
    ...note,
    body: note.body.replace("title: Mara", "title: Lady Mara"),
  }));
  expect(next.content[0]).toMatchObject({
    title: "Lady Mara",
    category: "Person",
    tags: ["npc"],
  });
  const renamed = updateNote(next, "mara", (note) => ({
    ...note,
    title: "Captain Mara",
  }));
  expect(readDocument(renamed.content[0].body).metadata.title).toBe(
    "Captain Mara",
  );
  const broken = updateNote(renamed, "mara", (note) => ({
    ...note,
    body: "---\nrelationships: [\n---\nKeep my prose.",
  }));
  expect(broken.content[0].body).toContain("Keep my prose.");
  expect(broken.content[0].title).toBe("Captain Mara");
  expect(
    documentReferences(broken.content[0].body, source).errors.length,
  ).toBeGreaterThan(0);
});

it("creates independent world-tab views, remaps them with copied notes, and round-trips relationships through packs and backups", async () => {
  let campaign = newApp().campaigns[0];
  campaign.content.push(
    { ...newNote("Mara", "mara"), body: markdown() },
    newNote("Court", "court"),
  );
  campaign = createWorldScreen(campaign, "World");
  campaign.screens.at(-1)!.world = {
    selectedNoteId: "mara",
    positions: { "local::court": { x: 12, y: 34 } },
  };
  const duplicated = duplicateScreen(campaign, campaign.activeScreenId);
  expect(duplicated.content).toEqual(campaign.content);
  expect(duplicated.screens.at(-1)!.world).toEqual(
    campaign.screens.at(-1)!.world,
  );
  const copied = copyCampaign(campaign),
    mara = copied.content.find((record) => record.title === "Mara")!,
    court = copied.content.find((record) => record.title === "Court")!;
  expect(copied.screens.at(-1)!.world).toEqual({
    selectedNoteId: mara.id,
    positions: { [`local::${court.id}`]: { x: 12, y: 34 } },
  });
  expect(
    documentReferences(mara.body, `local::${mara.id}`).references.every(
      (row) => row.target.split("#")[0] === `local::${court.id}`,
    ),
  ).toBe(true);
  const pack = exportRecords(
    campaign.content,
    "pack",
    entries(campaign, []),
    "World",
  );
  const preview = await prepareContentImport(JSON.stringify(pack.value));
  const imported = applyExchange(
    newApp().campaigns[0],
    preview.records,
    "copy",
  );
  const importedMara = imported.content.find(
      (record) => record.title === "Mara",
    )!,
    importedCourt = imported.content.find(
      (record) => record.title === "Court",
    )!;
  expect(
    documentReferences(
      importedMara.body,
      `local::${importedMara.id}`,
    ).references.every(
      (row) => row.target.split("#")[0] === `local::${importedCourt.id}`,
    ),
  ).toBe(true);
  expect(
    (await decodeBackup(await encodeBackup({ campaign, assets: [] }))).campaign,
  ).toEqual(campaign);
  const old = newApp();
  expect(migrateApp({ ...old, version: 18 }).version).toBe(SCHEMA_VERSION);
  expect(() =>
    campaignSchema.parse({
      ...campaign,
      screens: campaign.screens.map((screen) =>
        screen.kind === "world"
          ? { ...screen, widgets: campaign.screens[0].widgets }
          : screen,
      ),
    }),
  ).toThrow("cannot contain grid widgets");
});

it("queries cached occurrences by source, target and tags, updates edits, and retains unresolved targets", async () => {
  const index = cache();
  await index.sync("campaign", [
    { target: source, body: markdown() },
    { target: "local::court", body: "Court" },
  ]);
  expect(
    await index.query("campaign", { source, target: "local::court" }),
  ).toHaveLength(4);
  expect(await index.query("campaign", { tag: "secret" })).toHaveLength(2);
  expect(await index.query("other")).toEqual([]);
  await index.sync("campaign", [{ target: source, body: markdown() }]);
  expect(
    await index.query("campaign", { target: "local::court" }),
  ).toHaveLength(4);
  await index.sync("campaign", [{ target: source, body: "No references." }]);
  expect(await index.query("campaign")).toEqual([]);
});

it("rebuilds a divergent index from Markdown and rolls back an interrupted rebuild", async () => {
  const name = crypto.randomUUID(),
    index = cache(name),
    sources = [{ target: source, body: markdown() }];
  await index.sync("campaign", sources);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("relationships", "readwrite");
    tx.objectStore("relationships").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  expect(await index.query("campaign")).toHaveLength(0);
  await index.sync("campaign", sources, true);
  expect(await index.query("campaign")).toHaveLength(4);
  const original = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
    this: IDBObjectStore,
    ...args: Parameters<typeof original>
  ) {
    if (this.name === "documents")
      throw new Error("Simulated interrupted rebuild");
    return original.apply(this, args);
  });
  await expect(index.sync("campaign", sources, true)).rejects.toThrow(
    "interrupted",
  );
  vi.restoreAllMocks();
  expect(await index.query("campaign")).toHaveLength(4);
  await index.sync("campaign", sources, true);
  expect(await index.query("campaign")).toHaveLength(4);
});

it("rejects malformed metadata without caching partial declarations and supersedes queued stale edits", async () => {
  const index = cache();
  const broken =
    "---\nrelationships:\n - target: court\n   tags: nope\n---\n" +
    referenceMarkdown("Court", "local::court");
  const result = await index.sync("campaign", [
    { target: source, body: broken },
  ]);
  expect(result.errors[0].errors.join()).toContain("list of string tags");
  expect(result.relationships).toHaveLength(0);
  await Promise.all([
    index.sync("campaign", [{ target: source, body: markdown() }]),
    index.sync("campaign", [
      { target: source, body: referenceMarkdown("Latest", "local::latest") },
    ]),
  ]);
  expect((await index.query("campaign")).map((row) => row.target)).toEqual([
    "local::latest",
  ]);
});

it("clears a deleted campaign's cached data without affecting other campaigns, and can clear all derived data", async () => {
  const index = cache();
  await index.sync("one", [{ target: source, body: markdown() }]);
  await index.sync("two", [{ target: source, body: markdown() }]);
  await index.clear("one");
  expect(await index.query("one")).toHaveLength(0);
  expect(await index.query("two")).toHaveLength(4);
  await index.clear();
  expect(await index.query("two")).toHaveLength(0);
});
