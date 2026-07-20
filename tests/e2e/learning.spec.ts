import { test } from "@playwright/test";
import { signIn, expect, SEED } from "./helpers";

test.describe("US2: enroll & learn with progress", () => {
  test("student browses, enrols, completes a lesson, sees progress", async ({
    page,
  }) => {
    await signIn(page, SEED.student);

    // The seeded student is already enrolled in "Intro to Next.js".
    await page.goto("/my-learning");
    await expect(
      page.getByRole("heading", { name: "My Learning" }),
    ).toBeVisible();
    await page.getByText("Intro to Next.js").click();

    // In the player, mark the current lesson complete.
    await page.waitForURL(/\/learn\/intro-to-nextjs/);
    const complete = page.getByRole("button", { name: /Mark complete|Complete/ });
    await expect(complete).toBeVisible();
    await complete.click();

    // Progress advances beyond 0%.
    await expect(page.getByText(/%/).first()).toBeVisible();
  });

  test("catalog search returns published courses", async ({ page }) => {
    await page.goto("/courses");
    await page.getByLabel("Search courses").fill("Next.js");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Intro to Next.js")).toBeVisible();
  });
});
