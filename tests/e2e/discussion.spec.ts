import { test } from "@playwright/test";
import { signIn, expect, SEED } from "./helpers";

test.describe("US7: discussions & notifications", () => {
  test("student opens the discussion board and posts a thread", async ({ page }) => {
    await signIn(page, SEED.student);

    // The seeded student is enrolled in "Intro to Next.js".
    await page.goto("/learn/intro-to-nextjs/discussions");
    await expect(
      page.getByRole("heading", { name: /Discussion/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: "New thread" }).click();
    const title = `E2E question ${Date.now()}`;
    await page.getByPlaceholder("What's your question?").fill(title);
    await page.getByPlaceholder("Add details…").fill("Details of my question.");
    await page.getByRole("button", { name: "Post", exact: true }).click();

    // Lands on the thread page with the first post.
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Details of my question.")).toBeVisible();

    // Notification bell is present in the header.
    await expect(page.getByRole("link", { name: "Notifications" })).toBeVisible();
  });
});
