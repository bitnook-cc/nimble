import { test, slateURL, disconnect } from "./browser-fixtures";
import { expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

async function manager(page: Page, name = "My Campaign") {
  await page
    .getByRole("button", { name: `Switch campaign: ${name}`, exact: true })
    .click();
  return page.getByRole("dialog", { name: "Your campaigns" });
}
async function ready(page: Page) {
  await page.goto(slateURL(page));
  await expect(page.getByRole("main", { name: "GM screen" })).toBeVisible();
}
test("archive, restore, duplicate and delete the final campaign without recreating it", async ({
  page,
}) => {
  await ready(page);
  await manager(page);
  await page
    .getByRole("button", { name: "Archive campaign", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Choose your next adventure" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore My Campaign", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Switch campaign: My Campaign",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Duplicate campaign", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Switch campaign: My Campaign (copy)",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete campaign", exact: true })
    .click();
  const remove = page.getByRole("button", {
    name: "Delete campaign permanently",
    exact: true,
  });
  await expect(remove).toBeDisabled();
  await page
    .getByLabel("Type the campaign name to confirm")
    .fill("My Campaign (copy)");
  await remove.click();
  await page
    .getByRole("button", { name: "Delete campaign", exact: true })
    .click();
  await page
    .getByLabel("Type the campaign name to confirm")
    .fill("My Campaign");
  await remove.click();
  await expect(
    page.getByRole("heading", {
      name: "Choose your next adventure",
      includeHidden: true,
    }),
  ).toBeAttached();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Choose your next adventure" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Manage campaigns" }).click();
  await expect(
    page.getByText("No active campaigns.", { exact: false }),
  ).toBeVisible();
});

test("ZIP backup restores combat, rolls and attachments into a fresh installation offline", async ({
  page,
  browser,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Roll dice" }).click();
  const total = await page.locator(".result-total").textContent();
  await page
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Mira");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add combatant", exact: true })
    .click();
  await page.getByRole("button", { name: "Begin combat", exact: true }).click();
  await page.getByRole("button", { name: "Damage Mira", exact: true }).click();
  await manager(page);
  await page.getByRole("button", { name: "Attachments", exact: true }).click();
  await page.getByLabel("Add attachments", { exact: true }).setInputFiles({
    name: "map.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("The old forest map"),
  });
  await expect(
    page.getByText("Attachments saved on this device.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Campaigns", exact: true }).click();
  const downloadWait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export My Campaign", exact: true })
    .click();
  const backup = await downloadWait;
  const bytes = await readFile((await backup.path())!);
  const fresh = await browser.newContext({ baseURL: page.url() });
  try {
    const restored = await fresh.newPage();
    await ready(restored);
    await expect(
      restored.getByText("Ready for offline play", { exact: true }),
    ).toBeVisible();
    await restored.reload();
    await disconnect(fresh);
    await manager(restored);
    await restored
      .getByRole("button", { name: "Backup & recovery", exact: true })
      .click();
    await restored.getByLabel("Backup file", { exact: true }).setInputFiles({
      name: "campaign.slate.zip",
      mimeType: "application/zip",
      buffer: bytes,
    });
    await expect(restored.getByLabel("Restore mode")).toHaveValue("copy");
    await restored.getByLabel("Restore mode").selectOption("original");
    await restored
      .getByRole("button", { name: "Restore backup", exact: true })
      .click();
    await expect(
      restored.getByText("Campaign restored and ready to use.", {
        exact: true,
      }),
    ).toBeVisible();
    await restored
      .getByRole("button", { name: "Attachments", exact: true })
      .click();
    const attachmentWait = restored.waitForEvent("download");
    await restored
      .getByRole("button", { name: "Download map.txt", exact: true })
      .click();
    expect(await readFile((await (await attachmentWait).path())!, "utf8")).toBe(
      "The old forest map",
    );
    await restored
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await restored.reload();
    await expect(restored.locator(".result-total")).toHaveText(total!);
    await expect(
      restored.getByRole("button", { name: "Set HP for Mira" }),
    ).toHaveText("19/20");
    await expect(restored.locator(".is-active .combatant-name")).toContainText(
      "Mira",
    );
  } finally {
    await fresh.close();
  }
});

test("replacement requires confirmation and its recovery point restores local changes", async ({
  page,
}) => {
  await ready(page);
  await manager(page);
  const downloadWait = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export My Campaign", exact: true })
    .click();
  const bytes = await readFile((await (await downloadWait).path())!);
  await page
    .getByLabel("Rename current campaign", { exact: true })
    .fill("Local changes");
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(
    page.getByText("Campaign renamed.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Backup & recovery", exact: true })
    .click();
  await page.getByLabel("Backup file", { exact: true }).setInputFiles({
    name: "bad.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("bad archive"),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Switch campaign: Local changes",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Backup file", { exact: true }).setInputFiles({
    name: "good.zip",
    mimeType: "application/zip",
    buffer: bytes,
  });
  await page.getByLabel("Restore mode").selectOption("original");
  await expect(
    page.getByRole("button", { name: "Restore backup", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /Replace “Local changes”/ }).check();
  await page
    .getByRole("button", { name: "Restore backup", exact: true })
    .click();
  await expect(
    page.getByText("Campaign restored and ready to use.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show recovery points" }).click();
  await page
    .getByRole("button", { name: "Restore snapshot", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore recovery point", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Switch campaign: Local changes",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/slate-campaigns.png",
    fullPage: true,
  });
});

test("an unsupported storage version keeps the original and offers a complete recovery download", async ({
  page,
}) => {
  await ready(page);
  const original = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("nimble-slate");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      const store = tx.objectStore("state");
      const get = store.get("app");
      let data: unknown;
      get.onsuccess = () => {
        data = { ...get.result, version: 99 };
        store.put(data, "app");
      };
      tx.oncomplete = () => {
        db.close();
        resolve(data);
      };
      tx.onabort = () => reject(tx.error);
    });
  });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("different version");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export original data", exact: true })
    .click();
  const bytes = await readFile((await (await pending).path())!);
  expect(
    JSON.parse(strFromU8(unzipSync(bytes)["original-state.json"])),
  ).toEqual(original);
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("different version");
});
