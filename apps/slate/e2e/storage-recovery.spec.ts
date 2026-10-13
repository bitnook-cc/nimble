import { expect, type Page } from "@playwright/test";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { ready, saved } from "./ui-fixtures";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const caught: string[] = [];
  errors.set(page, caught);
  page.on("pageerror", (error) => caught.push(error.message));
  await page.goto(slateURL(page));
  await ready(page);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function damage(page: Page, mode: "missing" | "schema16") {
  return page.evaluate(async (mode) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("nimble-slate", 3);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    let campaignId = "";
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      const state = tx.objectStore("state"),
        request = state.get("app");
      request.onsuccess = () => {
        const data = request.result;
        campaignId = data.activeCampaignId;
        if (mode === "missing")
          data.campaigns[0].packRefs.push("missing-custom-pack@1");
        else data.version = 16;
        state.put(data, "app");
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
    db.close();
    return campaignId;
  }, mode);
}
async function fingerprint(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("nimble-slate", 3);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const value = await new Promise<string>((resolve, reject) => {
      const tx = db.transaction(
        ["state", "packs", "assets", "recovery"],
        "readonly",
      );
      const rows = ["state", "packs", "assets", "recovery"].map((name) =>
        tx.objectStore(name).getAll(),
      );
      tx.oncomplete = () =>
        resolve(JSON.stringify(rows.map((request) => request.result)));
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
    db.close();
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value),
    );
    return [...new Uint8Array(hash)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  });
}

test("missing packs allow export, cancellation and confirmed reset; a fresh campaign works offline", async ({
  page,
  context,
}) => {
  await page.getByLabel("Dice formula", { exact: true }).fill("2d8+5");
  await saved(page);
  const previous = await damage(page, "missing");
  await page.reload();
  const screen = page.getByRole("main", {
    name: "Local data recovery",
    exact: true,
  });
  await expect(screen.getByRole("alert")).toContainText(
    "Campaign content pack is missing",
  );
  const original = await fingerprint(page);
  const downloading = page.waitForEvent("download");
  await screen
    .getByRole("button", { name: "Export original data", exact: true })
    .click();
  const files = unzipSync(
    new Uint8Array(await readFile((await (await downloading).path())!)),
  );
  const raw = JSON.parse(strFromU8(files["original-state.json"]));
  expect(raw.campaigns[0].id).toBe(previous);
  expect(raw.campaigns[0].packRefs).toContain("missing-custom-pack@1");
  await screen
    .getByRole("button", { name: "Reset local data", exact: true })
    .click();
  let dialog = page.getByRole("dialog", {
    name: "Reset local data?",
    exact: true,
  });
  await expect(dialog).toContainText("permanently deletes");
  await dialog
    .getByRole("button", { name: "Keep local data", exact: true })
    .click();
  expect(await fingerprint(page)).toBe(original);
  await screen
    .getByRole("button", { name: "Reset local data", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Reset local data?", exact: true });
  await dialog
    .getByRole("button", {
      name: "Delete local data and start over",
      exact: true,
    })
    .click();
  await ready(page);
  await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
    "1d20",
  );
  const current = await page.evaluate(
    async () =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open("nimble-slate", 3);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("state"),
            data = tx.objectStore("state").get("app");
          tx.oncomplete = () => {
            db.close();
            resolve(data.result.activeCampaignId);
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
        request.onerror = () => reject(request.error);
      }),
  );
  expect(current).not.toBe(previous);
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Flame Dart");
  await expect(
    library.getByRole("button", { name: /Flame Dart spell/ }),
  ).toBeVisible();
  await library
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await page.reload();
  await ready(page);
  await disconnect(context);
  await page.reload();
  await ready(page);
  await page.getByRole("button", { name: /Roll dice/ }).click();
  await expect(page.locator(".roll-history .history-row")).toHaveCount(1);
});

test("a reset write failure keeps original data and can be retried", async ({
  page,
}) => {
  await damage(page, "missing");
  await page.reload();
  const screen = page.getByRole("main", {
    name: "Local data recovery",
    exact: true,
  });
  await expect(screen.getByRole("alert")).toContainText(
    "Campaign content pack is missing",
  );
  const original = await fingerprint(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "state" && fail) {
        fail = false;
        throw new DOMException("Reset storage is full", "QuotaExceededError");
      }
      return put.apply(this, args);
    };
  });
  await screen
    .getByRole("button", { name: "Reset local data", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Reset local data?",
    exact: true,
  });
  await dialog
    .getByRole("button", {
      name: "Delete local data and start over",
      exact: true,
    })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Reset storage is full",
  );
  expect(await fingerprint(page)).toBe(original);
  await dialog
    .getByRole("button", {
      name: "Delete local data and start over",
      exact: true,
    })
    .click();
  await ready(page);
});

test("schema 16 upgrades retain the campaign, tools and separately stored content packs", async ({
  page,
}) => {
  await page.getByLabel("Dice formula", { exact: true }).fill("2d8+5");
  await saved(page);
  await damage(page, "schema16");
  await page.reload();
  await ready(page);
  await expect(
    page.getByRole("main", { name: "Local data recovery" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
    "2d8+5",
  );
  await page
    .getByRole("button", { name: "Campaign library", exact: true })
    .click();
  const library = page.getByRole("dialog", {
    name: "Campaign library",
    exact: true,
  });
  await library
    .getByRole("searchbox", { name: "Search content", exact: true })
    .fill("Flame Dart");
  await expect(
    library.getByRole("button", { name: /Flame Dart spell/ }),
  ).toBeVisible();
});

test("a confirmed reset waits for a blocking tab and cannot be dismissed while deletion is pending", async ({
  page,
  context,
}) => {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("nimble-slate", 99);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    // Simulate an older tab that does not close its connection on versionchange.
    (
      window as unknown as { blockedSlateDatabase: IDBDatabase }
    ).blockedSlateDatabase = db;
  });
  const recovering = await context.newPage();
  recovering.on("pageerror", (error) => errors.get(page)!.push(error.message));
  try {
    await recovering.goto(page.url());
    const screen = recovering.getByRole("main", {
      name: "Local data recovery",
      exact: true,
    });
    await expect(screen.getByRole("alert")).toContainText(
      "Cannot open local data",
    );
    await screen
      .getByRole("button", { name: "Reset local data", exact: true })
      .click();
    const dialog = recovering.getByRole("dialog", {
      name: "Reset local data?",
      exact: true,
    });
    await dialog
      .getByRole("button", {
        name: "Delete local data and start over",
        exact: true,
      })
      .click();
    await expect(dialog.getByRole("status")).toContainText(
      "Close other Slate tabs",
    );
    await expect(
      dialog.getByRole("button", { name: "Close dialog", exact: true }),
    ).toBeDisabled();
    await recovering.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await page.evaluate(() =>
      (
        window as unknown as { blockedSlateDatabase: IDBDatabase }
      ).blockedSlateDatabase.close(),
    );
    await ready(recovering);
    await recovering.reload();
    await ready(recovering);
  } finally {
    await page.evaluate(() =>
      (
        window as unknown as { blockedSlateDatabase: IDBDatabase }
      ).blockedSlateDatabase.close(),
    );
    await recovering.close();
  }
});
