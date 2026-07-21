import { test } from "@playwright/test";
import { signIn, expect, SEED } from "./helpers";

test.describe("US6: admin console", () => {
  test("admin sees dashboard, creates a user, and navigates sections", async ({
    page,
  }) => {
    await signIn(page, SEED.admin);

    // Dashboard.
    await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();

    // Create a user.
    await page.getByRole("link", { name: "Users" }).click();
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await page.getByRole("button", { name: "Add user" }).click();
    const email = `e2e-user-${Date.now()}@created.test`;
    await page.getByLabel("Name").fill("E2E Created User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Initial password").fill("welcome123");
    await page.getByRole("button", { name: "Create user" }).click();
    await expect(page.getByText(email)).toBeVisible();

    // Review queue + categories render.
    await page.getByRole("link", { name: "Review queue" }).click();
    await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
    await page.getByRole("link", { name: "Categories" }).click();
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
    await page.getByRole("link", { name: "Reports" }).click();
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  });
});
