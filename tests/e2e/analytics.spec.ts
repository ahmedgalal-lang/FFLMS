import { test } from "@playwright/test";
import { signIn, signOut, expect, SEED } from "./helpers";

test.describe("US8: analytics & reports", () => {
  test("instructor course analytics renders", async ({ page }) => {
    await signIn(page, SEED.instructor);
    await page.goto("/courses/intro-to-nextjs");
    // Open the studio for the seeded course via the catalog is indirect; go to studio.
    await page.goto("/studio");
    await page.getByText("Intro to Next.js").first().click();
    await page.getByRole("link", { name: "Analytics" }).click();
    await expect(page.getByRole("heading", { name: /Analytics ·/ })).toBeVisible();
    await expect(page.getByText("Completion rate")).toBeVisible();
    await expect(page.getByText("Per-lesson completion")).toBeVisible();
  });

  test("admin reports renders", async ({ page }) => {
    await signIn(page, SEED.admin);
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
    await expect(page.getByText("Top courses by enrollment")).toBeVisible();
  });
});
