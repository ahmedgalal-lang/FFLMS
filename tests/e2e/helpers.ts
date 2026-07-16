import { type Page, expect } from "@playwright/test";

/** Sign in through the credentials form using a seeded account. */
export async function signIn(page: Page, email: string, password = "password123") {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(studio|my-learning|admin)/);
}

export const SEED = {
  admin: "admin@lms.test",
  instructor: "instructor@lms.test",
  student: "student@lms.test",
};

export { expect };
