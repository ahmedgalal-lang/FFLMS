import { test } from "@playwright/test";
import { signIn, signOut, expect, SEED } from "./helpers";

test.describe("US3: quizzes & automated grading", () => {
  test("instructor builds a quiz; student takes it and sees a score", async ({
    page,
  }) => {
    // --- Instructor: create a course with a lesson and attach a quiz ---
    await signIn(page, SEED.instructor);
    const title = `Quiz E2E ${Date.now()}`;
    await page.getByRole("button", { name: "New course" }).click();
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Summary").fill("Quiz end-to-end test course.");
    await page.getByRole("button", { name: "Create course" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.getByPlaceholder("New module title").fill("Module 1");
    await page.getByRole("button", { name: "Add module" }).click();
    await page.getByPlaceholder("New lesson title").fill("Lesson 1");
    await page.getByRole("button", { name: "Add lesson" }).click();

    // Add a text block so the course can publish.
    await page.getByRole("button", { name: "Add text" }).click();
    await page.getByLabel("Text content").fill("<p>Study this.</p>");
    await page.getByRole("button", { name: "Save" }).click();

    // Open the quiz builder for the lesson.
    await page.getByRole("link", { name: "Add quiz" }).click();
    await expect(page.getByRole("heading", { name: /Quiz ·/ })).toBeVisible();
    await page.getByRole("button", { name: "Create quiz" }).click();

    // Add one multiple-choice question.
    await page.getByLabel("Question prompt").fill("2 + 2 = ?");
    const optionInputs = page.getByLabel(/Option \d text/);
    await optionInputs.nth(0).fill("4");
    await optionInputs.nth(1).fill("5");
    // First option (index 0) is correct by default (radio checked).
    await page.getByRole("button", { name: "Add question" }).click();
    await expect(page.getByText("2 + 2 = ?")).toBeVisible();

    // Publish the course.
    await page.getByRole("link", { name: "Back to course" }).click();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("published", { exact: false })).toBeVisible();

    // Grab the slug from the "View" link.
    const viewHref = await page
      .getByRole("link", { name: /View/ })
      .getAttribute("href");
    expect(viewHref).toBeTruthy();
    const slug = viewHref!.split("/courses/")[1];

    // --- Student: enrol and take the quiz ---
    await signOut(page);
    await signIn(page, SEED.student);
    await page.goto(`/courses/${slug}`);
    await page.getByRole("button", { name: /Enrol/ }).click();
    await page.waitForURL(/\/learn\//);

    // Start the quiz, answer correctly, submit.
    await page.getByRole("button", { name: "Start quiz" }).click();
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Submit quiz" }).click();

    await expect(page.getByText("Passed")).toBeVisible();
    await expect(page.getByText("100%")).toBeVisible();
  });
});
