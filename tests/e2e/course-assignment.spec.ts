import { test } from "@playwright/test";
import { signIn, signOut, expect, SEED } from "./helpers";

test.describe("Assigned course visibility (specs/002-assign-courses, US1)", () => {
  test("instructor restricts a course and assigns it directly to a student", async ({
    page,
  }) => {
    await signIn(page, SEED.instructor);

    const title = `E2E Restricted Course ${Date.now()}`;
    await page.getByRole("button", { name: "New course" }).click();
    await page.getByLabel("Title").fill(title);
    await page
      .getByLabel("Summary")
      .fill("A restricted course for the assignment e2e test.");
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    // Build the minimum publishable curriculum.
    await page.getByPlaceholder("New module title").fill("Module 1");
    await page.getByRole("button", { name: "Add module" }).click();
    await page.getByPlaceholder("New lesson title").fill("Lesson 1");
    await page.getByRole("button", { name: "Add lesson" }).click();
    await page.getByRole("button", { name: "Add text" }).click();
    await page.getByLabel("Text content").fill("<p>Restricted content</p>");
    await page.getByRole("button", { name: "Save" }).click();

    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("published", { exact: false })).toBeVisible();

    // Restrict it via course settings.
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByLabel("Visibility").selectOption("RESTRICTED");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Restricted", { exact: true })).toBeVisible();

    // A restricted course is not in the public catalog.
    await page.goto("/courses");
    await page.getByLabel("Search courses").fill(title);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText(title)).toHaveCount(0);

    // Assign it directly to the seeded student.
    await page.goto("/studio");
    await page.getByRole("link", { name: new RegExp(title) }).click();
    await page.getByRole("link", { name: "Assign students" }).click();
    await expect(page.getByRole("heading", { name: "Assign students" })).toBeVisible();
    await page.getByLabel("Assign by email").fill(SEED.student);
    await page.getByRole("button", { name: "Assign" }).click();
    await expect(page.getByText(SEED.student)).toBeVisible();

    await signOut(page);

    // The assigned student sees it in My Learning, already enrolled.
    await signIn(page, SEED.student);
    await page.goto("/my-learning");
    await expect(page.getByText(title)).toBeVisible();
  });
});
