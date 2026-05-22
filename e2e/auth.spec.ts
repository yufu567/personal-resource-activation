import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders and accepts demo credentials", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h2")).toContainText("登录");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/resources");
    await expect(page.locator("h1")).toContainText("优先处理");
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h2")).toContainText("注册");
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/resources");
    await expect(page).toHaveURL(/\/login/);
  });
});
