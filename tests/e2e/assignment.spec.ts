import { test } from "@playwright/test";
import { signIn, signOut, expect, SEED } from "./helpers";

test.describe("US4: assignments & manual grading", () => {
  test("student submits the seeded assignment; instructor grades it", async ({
    page,
  }) => {
    // The seed attaches an assignment to the last lesson ("Server Components").
    await signIn(page, SEED.student);
    await page.goto("/learn/intro-to-nextjs");

    // Navigate to the lesson that has the assignment.
    await page.getByRole("link", { name: /Server Components/ }).click();
    await expect(page.getByRole("heading", { name: /assignment|Next\.js page/i })).toBeVisible();

    const answer = `My submission ${Date.now()}`;
    await page.getByLabel("Submission text").fill(answer);
    await page.getByRole("button", { name: /Submit assignment|Resubmit/ }).click();
    await expect(page.getByText(/submitted/i)).toBeVisible();

    // Instructor grades it.
    await signOut(page);
    await signIn(page, SEED.instructor);
    await page.goto("/studio");
    await page.getByText("Intro to Next.js").first().click();
    // Open the assignment builder for the "Server Components" lesson.
    await page
      .getByRole("link", { name: "Edit assignment" })
      .last()
      .click();
    await expect(page.getByText("Submissions")).toBeVisible();

    const scoreInput = page.getByLabel(/Score \(/).first();
    await scoreInput.fill("90");
    await page.getByRole("button", { name: /^Grade$|Update grade/ }).first().click();
    await expect(page.getByText(/90\//)).toBeVisible();
  });
});
