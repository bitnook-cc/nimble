import type { campaigns } from "@nimble/shared";
import { Page, expect, test } from "@playwright/test";

async function setup(page: Page, isGM = true) {
  const user = {
    id: "owner",
    googleId: "google-owner",
    email: "gm@example.test",
    name: "Morgan",
    picture: "",
  };
  const state: campaigns.CampaignState = {
    description: "",
    items: [],
    treasury: { gold: 0, silver: 0 },
    journal: [],
    sessions: [],
    monsters: [],
    encounters: [],
    runs: [],
    activity: [],
  };
  state.description = "A journey through the Ashen Vale.";
  state.items.push({
    id: "supplies",
    item: { id: "rope", name: "Silk rope", type: "freeform", size: 1 },
    quantity: 2,
    location: "Mule pack",
    hidden: false,
  });
  state.sessions.push({
    id: "first-session",
    title: "Across the bridge",
    scheduledFor: "Saturday 7pm Sydney",
    status: "planned",
    summary: "Meet at the old watchtower.",
    gmNotes: isGM ? "The guide is a spy." : "",
  });
  const view: campaigns.CampaignView = {
    id: "campaign-test",
    name: "The Ashen Road",
    ownerId: "owner",
    revision: 1,
    isGM,
    members: [
      {
        userId: "owner",
        name: "Morgan",
        role: isGM ? "GM" : "PLAYER",
        characterId: null,
        shareNotes: false,
        character: null,
        syncedAt: null,
        inventoryRevision: 0,
      },
      {
        userId: "player",
        name: "Casey",
        role: "PLAYER",
        characterId: "hero",
        shareNotes: false,
        syncedAt: new Date().toISOString(),
        inventoryRevision: 0,
        character: {
          id: "hero",
          name: "Tamsin",
          level: 3,
          classId: "hunter",
          hitPoints: { current: 18, max: 24 },
          inventory: { items: [], currency: { gold: 5 } },
        },
      },
    ],
    state,
    invites: [],
  };
  const commands: campaigns.Command[] = [];
  // Exercise the deployed same-origin API path.
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    url.pathname = url.pathname.replace(/^\/api(?=\/)/, "");
    const reply = (json: unknown, status = 200) =>
      route.fulfill({
        status,
        json,
        headers: {
          "access-control-allow-origin": "http://localhost:3000",
          "access-control-allow-credentials": "true",
        },
      });
    if (request.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "http://localhost:3000",
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    if (url.pathname === "/auth/user") return reply({ user });
    if (url.pathname === "/sync/inventories") return reply([]);
    if (url.pathname === "/campaigns")
      return reply([
        { id: view.id, name: view.name, revision: view.revision, role: isGM ? "GM" : "PLAYER" },
      ]);
    if (url.pathname.endsWith("/commands")) {
      const mutation = request.postDataJSON() as campaigns.Mutation;
      commands.push(mutation.command);
      if (mutation.expectedRevision !== view.revision)
        return reply({ error: "Campaign changed. Review and retry." }, 409);
      view.revision++;
      const c = mutation.command;
      if (c.type === "journal") {
        const i = state.journal.findIndex((e) => e.id === c.entry.id);
        if (i < 0) state.journal.push(c.entry);
        else state.journal[i] = c.entry;
      }
      if (c.type === "monster") {
        const index = state.monsters.findIndex((monster) => monster.id === c.entry.id);
        if (index < 0) state.monsters.push(c.entry);
        else state.monsters[index] = c.entry;
      }
      if (c.type === "delete" && c.collection === "monsters") {
        state.monsters = state.monsters.filter((monster) => monster.id !== c.id);
      }
      if (c.type === "encounter") state.encounters.push(c.entry);
      if (c.type === "start")
        state.runs.push({
          id: "run",
          encounterId: c.encounterId,
          sessionId: c.sessionId,
          name: state.encounters[0].name,
          round: 1,
          status: "active",
          objective: "Hold the bridge",
          environment: "River",
          combatants: [
            {
              id: "enemy",
              name: state.monsters[0].name,
              monster: state.monsters[0],
              hp: state.monsters[0].hitPoints,
              actions: 0,
              conditions: "",
              phase: "normal",
              revealed: false,
              wave: 1,
            },
          ],
        });
      if (c.type === "combatant") Object.assign(state.runs[0].combatants[0], c);
      if (c.type === "round") state.runs[0].round++;
      if (c.type === "finish") state.runs[0].status = "completed";
      return reply({ revision: view.revision });
    }
    if (url.pathname.endsWith("/invites") && request.method() === "POST")
      return reply({ token: "test-invite-token" });
    if (url.pathname === `/campaigns/${view.id}`) return reply(view);
    return reply({});
  });
  await page.goto("http://127.0.0.1:3000/campaigns/?campaign=campaign-test");
  await expect(page.getByRole("heading", { name: "The Ashen Road" })).toBeVisible();
  return { view, commands };
}

test("GM can view a player, share a quest, and run a prepared encounter", async ({ page }) => {
  const { commands } = await setup(page);
  await page.getByRole("button", { name: "View character", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tamsin — character sheet" })).toBeVisible();
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Find the missing scout");
  await page.getByLabel("Type", { exact: true }).selectOption("quest");
  await page.getByLabel("Who can see this?").selectOption("party");
  await page.getByLabel("Content", { exact: true }).fill("Search the old watchtower.");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("heading", { name: "Find the missing scout" })).toBeVisible();
  expect(commands[0]).toMatchObject({
    type: "journal",
    entry: { visibility: "party", kind: "quest" },
  });
  await page.getByRole("button", { name: "Encounters", exact: true }).click();
  await page.getByRole("button", { name: "Create monster" }).click();
  await page.getByRole("button", { name: "Save monster", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit monster", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New encounter", exact: true }).click();
  await page.getByLabel("Encounter name", { exact: true }).fill("Bridge ambush");
  await page.getByRole("button", { name: "Add enemy group", exact: true }).click();
  await page.getByRole("button", { name: "Save encounter", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bridge ambush · Round 1" })).toBeVisible();
  await page.getByLabel("Visible to party").check();
  await page.getByLabel("HP", { exact: true }).fill("7");
  await page.getByRole("button", { name: "Update enemy" }).click();
  await page.getByRole("button", { name: "Next round" }).click();
  await expect(page.getByRole("heading", { name: "Bridge ambush · Round 2" })).toBeVisible();
  await page.screenshot({ path: "test-results/campaign-encounter.png", fullPage: true });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Finish encounter" }).click();
  await expect(page.getByRole("heading", { name: "Encounter history" })).toBeVisible();
});

test("player workspace and mobile layout keep GM controls out of view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, false);
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "View character", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByText("Silk rope × 2")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add GM treasure" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Claim", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Encounters", exact: true }).click();
  await expect(page.getByRole("button", { name: "New encounter", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Sessions", exact: true }).click();
  await expect(page.getByText("The guide is a spy.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Across the bridge" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "test-results/campaign-mobile.png", fullPage: true });
});

for (const kind of ["standard", "legendary"] as const) {
  test(`${kind} monster builder creates, edits and deletes a campaign monster`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const { view, commands } = await setup(page);
    await page.getByRole("button", { name: "Encounters", exact: true }).click();
    await page.getByRole("button", { name: "Create monster", exact: true }).click();
    if (kind === "legendary")
      await page.getByRole("button", { name: "Make legendary", exact: true }).click();
    const nameInput = page.getByPlaceholder(
      kind === "legendary" ? "Legendary monster name" : "Monster name",
      { exact: true },
    );
    await nameInput.fill("Ashen sentinel");
    await page.getByRole("button", { name: "Save monster", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ashen sentinel", exact: true })).toBeVisible();
    expect(commands.at(-1)).toMatchObject({
      type: "monster",
      entry: { name: "Ashen sentinel", kind },
    });
    expect(view.state.monsters[0]).toMatchObject(
      kind === "legendary"
        ? { level: 5, armor: "Medium", hitPoints: 150, lastStandHp: 50 }
        : { level: 1, armor: "None", hitPoints: 26 },
    );
    await page.getByRole("button", { name: "Edit monster", exact: true }).click();
    await expect(nameInput).toHaveValue("Ashen sentinel");
    await nameInput.fill("Ancient sentinel");
    await page.getByRole("button", { name: "Heavy", exact: true }).click();
    await page.getByRole("button", { name: "Save monster", exact: true }).click();
    await expect(page.getByRole("button", { name: "Save monster", exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Ancient sentinel", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "The Ashen Road", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Encounters", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Ancient sentinel", exact: true }),
    ).toBeVisible();
    expect(view.state.monsters).toHaveLength(1);
    expect(view.state.monsters[0]).toMatchObject({
      armor: "Heavy",
      hitPoints: kind === "legendary" ? 115 : 16,
    });
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ancient sentinel", exact: true })).toHaveCount(
      0,
    );
    expect(view.state.monsters).toHaveLength(0);
    expect(errors).toEqual([]);
  });
}

test("a refresh preserves a draft and requires review before replacing newer data", async ({
  page,
}) => {
  const { view, commands } = await setup(page);
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("An unfinished discovery");
  view.revision++;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Use latest version for this draft" }),
  ).toBeVisible();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("An unfinished discovery");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  expect(commands).toHaveLength(0);
  await page.getByRole("button", { name: "Use latest version for this draft" }).click();
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "An unfinished discovery" })).toBeVisible();
});
