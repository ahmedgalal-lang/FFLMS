import { test } from "@playwright/test";
import { signIn, expect, SEED } from "./helpers";

test.describe("US1: authoring & publishing", () => {
  test("instructor creates, builds, and publishes a course", async ({
    page,
  }) => {
    await signIn(page, SEED.instructor);

    const title = `E2E Course ${Date.now()}`;
    await page.getByRole("button", { name: "New course" }).click();
    await page.getByLabel("Title").fill(title);
    await page
      .getByLabel("Summary")
      .fill("An end-to-end authored course for the test suite.");
    await page.getByRole("button", { name: "Create course" }).click();

    // Lands on the builder.
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    // Edit course settings: rename the course and confirm it persists.
    const renamed = `${title} (edited)`;
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(
      page.getByRole("heading", { name: "Course settings" }),
    ).toBeVisible();
    await page.getByLabel("Title", { exact: true }).fill(renamed);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: renamed })).toBeVisible();

    // Publish is gated until there is a module + lesson.
    await expect(page.getByText("Before you can publish:")).toBeVisible();

    // Add a module.
    await page.getByPlaceholder("New module title").fill("Module 1");
    await page.getByRole("button", { name: "Add module" }).click();

    // Add a lesson.
    await page.getByPlaceholder("New lesson title").fill("Lesson 1");
    await page.getByRole("button", { name: "Add lesson" }).click();

    // Add a text content block.
    await page.getByRole("button", { name: "Add text" }).click();
    await page.getByLabel("Text content").fill("<p>Hello learners</p>");
    await page.getByRole("button", { name: "Save" }).click();

    // Publish.
    const publishBtn = page.getByRole("button", { name: "Publish" });
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();
    await expect(page.getByText("published", { exact: false })).toBeVisible();

    // Appears in the catalog under its edited title.
    await page.goto("/courses");
    await page.getByLabel("Search courses").fill(renamed);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText(renamed)).toBeVisible();
  });
});
