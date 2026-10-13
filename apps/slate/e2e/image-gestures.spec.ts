import { expect, type Locator } from "@playwright/test";
import { test, slateURL, disconnect } from "./browser-fixtures";
import { ready, saved, openWidgetPicker } from "./ui-fixtures";

test.use({ viewport: { width: 1280, height: 900 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.goto(slateURL(page));
  await ready(page);
  await openWidgetPicker(page);
  const picker = page.getByRole("dialog", {
    name: "Add a widget",
    exact: true,
  });
  await picker.getByLabel("Search widgets").fill("Image card");
  await picker.getByRole("button", { name: /^Image card/ }).click();
  await page
    .getByRole("button", { name: "Expand Image card", exact: true })
    .click();
  const popup = page.getByRole("dialog", { name: "Image card", exact: true });
  await popup
    .getByLabel("Import local image", { exact: true })
    .setInputFiles("public/icon-192.png");
  await expect(popup.getByRole("img")).toBeVisible();
  await saved(page);
});

async function matrix(image: Locator) {
  return image.evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { zoom: m.a, x: m.e, y: m.f };
  });
}

test("wheel zoom stays under the pointer, dragging works outside the card, and keyboard controls persist offline", async ({
  page,
  context,
}) => {
  const popup = page.getByRole("dialog", { name: "Image card", exact: true });
  const viewport = popup.getByRole("region", { name: "Interactive image" });
  const image = popup.getByRole("img");
  const box = (await viewport.boundingBox())!;
  // Integer input coordinates/deltas avoid engine rounding of wheel input.
  const mouseX = Math.round(box.x + box.width / 2 + 30);
  const mouseY = Math.round(box.y + box.height / 2 + 20);
  const zoom = Math.exp(350 * 0.002);
  await page.mouse.move(mouseX, mouseY);
  await page.mouse.wheel(0, -350);
  await expect(popup.getByLabel("Image zoom")).toHaveText("201%");
  const anchored = await matrix(image);
  expect(anchored.zoom).toBeCloseTo(zoom, 5);
  expect(anchored.x).toBeCloseTo(
    -(mouseX - box.x - box.width / 2) * (zoom - 1),
  );
  expect(anchored.y).toBeCloseTo(
    -(mouseY - box.y - box.height / 2) * (zoom - 1),
  );
  const scroll = await page.evaluate(() => window.scrollY);
  await page.mouse.down();
  const endY = Math.round(box.y + box.height / 2 + 50);
  await page.mouse.move(Math.round(box.x + box.width + 20), endY, {
    steps: 8,
  });
  await page.mouse.up();
  const dragged = await matrix(image);
  expect(dragged.x).toBeGreaterThan(anchored.x + 100);
  expect(dragged.y).toBeCloseTo(anchored.y + endY - mouseY);
  await expect(viewport).not.toHaveClass(/image-dragging/);
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  await viewport.focus();
  await page.keyboard.press("0");
  await expect(popup.getByLabel("Image zoom")).toHaveText("100%");
  await expect(
    popup.getByRole("button", { name: "Zoom out", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("+");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  const keyboardView = await matrix(image);
  expect(keyboardView.zoom).toBeCloseTo(1.25);
  expect(keyboardView.x).toBeCloseTo(box.width * 0.05);
  expect(keyboardView.y).toBeCloseTo(box.height * 0.05);
  await popup
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await saved(page);
  const tile = page.getByRole("region", { name: "Image card", exact: true });
  await expect(tile.getByLabel("Image zoom")).toHaveText("125%");
  await expect(tile.getByRole("slider")).toHaveCount(0);
  await disconnect(context);
  await page.reload();
  await ready(page);
  await expect(tile.getByLabel("Image zoom")).toHaveText("125%");
  await page
    .getByRole("button", { name: "Expand Image card", exact: true })
    .click();
  await expect.poll(() => matrix(image)).toEqual(keyboardView);
  await popup.getByRole("button", { name: "Fit image", exact: true }).click();
  await expect.poll(() => matrix(image)).toEqual({ zoom: 1, x: 0, y: 0 });
});

test("touch pointers pinch, switch to one-finger pan without jumping and recover after cancellation", async ({
  page,
}) => {
  const popup = page.getByRole("dialog", { name: "Image card", exact: true });
  const viewport = popup.getByRole("region", { name: "Interactive image" });
  const image = popup.getByRole("img");
  await expect(viewport).toHaveCSS("touch-action", "none");
  const box = (await viewport.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  // Synthetic pointer streams have no native capture target. Native capture is
  // exercised by the mouse test and by the Chromium touch test below.
  await viewport.evaluate((el) => {
    el.setPointerCapture = () => {};
  });
  // Use the same Pointer Events stream on every engine, including touch cancellation.
  async function pointer(type: string, id: number, px: number, py: number) {
    await viewport.dispatchEvent(type, {
      pointerId: id,
      pointerType: "touch",
      button: 0,
      clientX: px,
      clientY: py,
    });
  }
  await pointer("pointerdown", 1, x - 30, y);
  await pointer("pointerdown", 2, x + 30, y);
  await pointer("pointermove", 1, x - 60, y);
  await pointer("pointermove", 2, x + 60, y);
  await expect(popup.getByLabel("Image zoom")).toHaveText("200%");
  expect(await matrix(image)).toEqual({ zoom: 2, x: 0, y: 0 });
  await pointer("pointerup", 2, x + 60, y);
  await pointer("pointermove", 1, x - 20, y + 25);
  expect(await matrix(image)).toEqual({ zoom: 2, x: 40, y: 25 });
  await pointer("pointercancel", 1, x - 20, y + 25);
  await expect(viewport).not.toHaveClass(/image-dragging/);
  await pointer("pointermove", 1, x + 100, y + 100);
  expect(await matrix(image)).toEqual({ zoom: 2, x: 40, y: 25 });
  await saved(page);
  await viewport.evaluate((el) => {
    Reflect.deleteProperty(el, "setPointerCapture");
  });
  await viewport.focus();
  await page.keyboard.press("0");
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, -100000);
  await expect(popup.getByLabel("Image zoom")).toHaveText("400%");
  await expect(
    popup.getByRole("button", { name: "Zoom in", exact: true }),
  ).toBeDisabled();
  await page.mouse.down();
  await page.mouse.move(x + box.width * 0.6, y);
  await page.mouse.up();
  expect((await matrix(image)).x).toBeGreaterThan(box.width / 2);
  await saved(page);
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, 100000);
  await expect(popup.getByLabel("Image zoom")).toHaveText("100%");
  await popup.getByRole("button", { name: "Fit image", exact: true }).click();
  await expect.poll(() => matrix(image)).toEqual({ zoom: 1, x: 0, y: 0 });
});

test("native touch input can pinch and pan on a small screen", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Native touch injection uses Chromium's browser protocol; other engines cover the pointer stream.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const popup = page.getByRole("dialog", { name: "Image card", exact: true });
  const viewport = popup.getByRole("region", { name: "Interactive image" });
  const box = (await viewport.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: x - 30, y, id: 1 },
      { x: x + 30, y, id: 2 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: x - 60, y, id: 1 },
      { x: x + 60, y, id: 2 },
    ],
  });
  await expect(popup.getByLabel("Image zoom")).toHaveText("200%");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 3 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 30, y: y + 20, id: 3 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const view = await matrix(popup.getByRole("img"));
  expect(view.zoom).toBeCloseTo(2);
  expect(view.x).toBeCloseTo(30, 0);
  expect(view.y).toBeCloseTo(20, 0);
  await expect(viewport).not.toHaveClass(/image-dragging/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await client.detach();
  await saved(page);
});
