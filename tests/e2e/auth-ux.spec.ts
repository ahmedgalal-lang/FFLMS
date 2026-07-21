import { test } from "@playwright/test";
import { expect, SEED } from "./helpers";

const SESSION_COOKIE = "authjs.session-token";

async function sessionCookieExpiry(page: import("@playwright/test").Page) {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === SESSION_COOKIE)?.expires;
}

test.describe("Auth UX: show password & remember me", () => {
  test("show-password toggle reveals and hides the password", async ({ page }) => {
    await page.goto("/sign-in");
    const pwd = page.getByLabel("Password", { exact: true });
    await pwd.fill("secret123");
    await expect(pwd).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(pwd).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(pwd).toHaveAttribute("type", "password");
  });

  test("remember me unchecked yields a session cookie; checked yields a persistent one", async ({
    page,
  }) => {
    // Unchecked → ephemeral (session) cookie: expires === -1.
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(SEED.student);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByRole("checkbox", { name: "Remember me" }).uncheck();
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/(my-learning|dashboard)/);
    expect(await sessionCookieExpiry(page)).toBe(-1);

    // Sign out, then sign in with Remember me checked → persistent cookie.
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL(/\/(sign-in)?$/);

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(SEED.student);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    // Remember me is checked by default.
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/(my-learning|dashboard)/);
    const expiry = await sessionCookieExpiry(page);
    expect(expiry).toBeGreaterThan(0);
  });
});
