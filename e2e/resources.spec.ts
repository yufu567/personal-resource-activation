import { test, expect } from "@playwright/test";

test.describe("Resource Workspace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/resources");
  });

  test("adds a resource via the form", async ({ page }) => {
    await page.waitForSelector("text=添加资源");
    await page.fill('input[id="title"]', "E2E Test Resource");
    await page.fill('input[id="url"]', "https://example.com/e2e-test");
    await page.fill('textarea[id="content"]', "Playwright E2E test resource.");
    await page.click('button[type="submit"]');
    await page.waitForSelector("text=E2E Test Resource", { timeout: 10000 });
    await expect(page.locator("text=E2E Test Resource").first()).toBeVisible();
  });

  test("filters resources by source", async ({ page }) => {
    await page.waitForSelector("text=资源流");
    await page.click("text=GitHub Star");
    await expect(page.locator("text=Agent workflow")).toBeVisible();
  });

  test("language switcher changes page language", async ({ page }) => {
    await page.click('button:has(.lucide-globe)');
    await page.click("text=English");
    await page.waitForSelector("text=Inbox");
    await expect(
      page.locator("text=Add Resource").or(page.locator("text=Add & Analyze")),
    ).toBeVisible();
  });

  test("theme toggle works", async ({ page }) => {
    const themeButton = page
      .locator("button:has(.lucide-sun), button:has(.lucide-moon)")
      .first();
    await themeButton.click();
    await page.click("text=深色");
    await expect(page.locator("html.dark")).toBeAttached();
  });
});
