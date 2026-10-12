import { test, slateURL, disconnect, stopServer } from "./browser-fixtures";
import { expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { ready, saved } from "./ui-fixtures";

test("offline checks reject an uncached fresh installation", async ({ page, browser }) => {
  await page.goto(slateURL(page));
  await ready(page);
  const url = page.url();
  const fresh = await browser.newContext();
  try {
    await disconnect(fresh);
    const uncached = await fresh.newPage();
    await expect(uncached.goto(url)).rejects.toThrow();
  } finally {
    await fresh.close();
  }
});

test("a failed local save keeps the edit visible and retry commits it offline", async ({
  page,
  context,
}) => {
  await page.goto(slateURL(page));
  await ready(page);
  await disconnect(context);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "state" && fail) {
        fail = false;
        throw new DOMException("Device storage is full", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  await page.getByLabel("Dice formula", { exact: true }).fill("2d8+5");
  await expect(page.getByRole("alert")).toContainText("not saved");
  await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
    "2d8+5",
  );
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await saved(page);
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
    "2d8+5",
  );
});

test("a real waiting service worker cannot update with failed saves and preserves data after activation", async ({
  browser,
}) => {
  let version = 1;
  const dist = resolve("dist");
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url!, "http://localhost").pathname;
      const file = resolve(
        dist,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!file.startsWith(dist + "\\") && !file.startsWith(dist + "/")) {
        response.writeHead(403).end();
        return;
      }
      const source = await readFile(file);
      const types: Record<string, string> = {
        ".js": "application/javascript",
        ".html": "text/html",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
        ".png": "image/png",
        ".webmanifest": "application/manifest+json",
      };
      response.writeHead(200, {
        "Content-Type": types[extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(
        pathname === "/sw.js"
          ? Buffer.concat([
              source,
              Buffer.from(`\n// release test ${version}\n`),
            ])
          : source,
      );
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No release test server");
  const context = await browser.newContext(),
    page = await context.newPage();
  try {
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await ready(page);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await ready(page);
    version = 2;
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg!.update();
    });
    const update = page.getByRole("button", {
      name: "Update Slate",
      exact: true,
    });
    await expect(update).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      let failing = true;
      Object.assign(window, {
        allowSave: () => {
          failing = false;
        },
      });
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === "state" && failing)
          throw new DOMException(
            "Device storage is full",
            "QuotaExceededError",
          );
        return original.apply(this, args);
      };
    });
    await page.getByLabel("Dice formula", { exact: true }).fill("3d6+9");
    await expect(page.getByRole("alert")).toContainText("not saved");
    await expect(update).toBeDisabled();
    await page.evaluate(() => {
      (window as unknown as { allowSave: () => void }).allowSave();
    });
    await page.getByRole("button", { name: "Retry save", exact: true }).click();
    await saved(page);
    await expect(update).toBeEnabled();
    await update.click();
    await expect(update).not.toBeVisible();
    await ready(page);
    await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
      "3d6+9",
    );
    await disconnect(context, server);
    await page.reload();
    await ready(page);
    await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
      "3d6+9",
    );
  } finally {
    await context.close();
    await stopServer(server);
  }
});

test("export failures appear above popovers and preserve the saved campaign", async ({
  page,
}) => {
  await page.goto(slateURL(page));
  await ready(page);
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new Error("Downloads are unavailable on this device");
    };
  });
  await page
    .getByRole("button", { name: "Workspace status", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Download backup", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Export failed",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toContainText(
    "Downloads are unavailable",
  );
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await saved(page);
  await expect(page.getByLabel("Dice formula", { exact: true })).toHaveValue(
    "1d20",
  );
});
