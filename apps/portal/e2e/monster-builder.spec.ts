import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { anyMonsterSchema } from "@nimble/shared/monsters/schemas";

for (const kind of ["standard", "legendary"] as const) {
  test(`${kind} monster builds, persists, exports, edits and deletes`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/monsters/new");
    if (kind === "legendary")
      await page
        .getByRole("button", { name: "Legendary", exact: true })
        .click();
    const nameInput = page.getByPlaceholder(
      kind === "legendary" ? "Legendary monster name" : "Monster name",
      { exact: true },
    );
    await nameInput.fill("Ashen sentinel");
    await page
      .getByRole("button", { name: "Create Monster", exact: true })
      .click();
    const card = page.getByRole("button", { name: /Ashen sentinel/ });
    await expect(card).toBeVisible();
    await page.reload();
    await expect(card).toBeVisible();
    await card.click();
    await expect(nameInput).toHaveValue("Ashen sentinel");
    const campaignDownload = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Campaign JSON", exact: true })
      .click();
    const campaign = await campaignDownload;
    const exported = JSON.parse(
      await readFile((await campaign.path())!, "utf8"),
    );
    expect(anyMonsterSchema.safeParse(exported).success).toBe(true);
    expect(exported).toMatchObject({ name: "Ashen sentinel", kind });
    const nimbrewDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const nimbrew = await nimbrewDownload;
    expect(nimbrew.suggestedFilename()).toBe("ashen-sentinel-nimbrew.json");
    expect(
      JSON.parse(await readFile((await nimbrew.path())!, "utf8")),
    ).toHaveProperty("hp");
    await nameInput.fill("Ancient sentinel");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("button", { name: /Ancient sentinel/ }).click();
    await expect(nameInput).toHaveValue("Ancient sentinel");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(
      page.getByText("No Monsters Yet", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
