import { expect, test } from "@playwright/test";

import { CharacterTestUtils } from "./utils/character-utils";

test("damage and healing change HP by the confirmed amount", async ({ page }) => {
  await page.goto("/");
  await new CharacterTestUtils(page).createCharacter();
  const hp = page.getByText(/^\d+\/\d+ HP$/);
  const maximum = Number((await hp.innerText()).split("/")[1].split(" ")[0]);
  const healing = page.getByRole("button", { name: "Healing", exact: true });
  await expect(healing).toBeDisabled();
  await page.getByRole("button", { name: "Damage", exact: true }).click();
  const damage = page.getByRole("dialog", { name: "Apply Damage" });
  await damage.getByRole("spinbutton", { name: "Amount" }).fill("2");
  await damage.getByRole("button", { name: "Apply Damage" }).click();
  await expect(hp).toHaveText(maximum - 2 + "/" + maximum + " HP");
  await healing.click();
  const heal = page.getByRole("dialog", { name: "Apply Healing" });
  await heal.getByRole("spinbutton", { name: "Amount" }).fill("2");
  await heal.getByRole("button", { name: "Apply Healing" }).click();
  await expect(hp).toHaveText(maximum + "/" + maximum + " HP");
  await expect(healing).toBeDisabled();
});
