import { test } from "@playwright/test";
import { signIn, expect, SEED } from "./helpers";

test.describe("US5: completion certificate & verification", () => {
  test("completing the course issues a verifiable certificate", async ({
    page,
  }) => {
    await signIn(page, SEED.student);
    await page.goto("/learn/intro-to-nextjs");

    // Complete every lesson via the player's "Complete & continue" button.
    for (let i = 0; i < 6; i++) {
      const btn = page.getByRole("button", {
        name: /Complete & continue|Mark complete/,
      });
      if (!(await btn.first().isVisible().catch(() => false))) break;
      await btn.first().click();
      await page.waitForTimeout(400);
    }

    // Grades page shows the earned certificate + verify link.
    await page.goto("/learn/intro-to-nextjs/grades");
    await expect(page.getByText("Certificate earned")).toBeVisible();

    // Follow the verify link and confirm validity publicly.
    await page.getByRole("link", { name: "Verify", exact: true }).click();
    await expect(page.getByText("Valid certificate")).toBeVisible();
    await expect(page.getByText("Sam Student")).toBeVisible();
  });
});
