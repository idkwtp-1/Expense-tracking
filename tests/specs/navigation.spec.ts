import { test, expect } from "@playwright/test";

test.describe("App Shell & Sidebar Navigation - Tier 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T1-F1-01: Navigate to Home", async ({ page }) => {
    const link = page.getByRole("link", { name: "Home", exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/");
  });

  test("T1-F1-02: Navigate to Transactions", async ({ page }) => {
    const link = page.getByRole("link", { name: "Transactions", exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/transactions/);
  });

  test("T1-F1-03: Navigate to Budget", async ({ page }) => {
    const link = page.getByRole("link", { name: "Budget", exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/budget/);
  });

  test("T1-F1-04: Navigate to Analytics", async ({ page }) => {
    const link = page.getByRole("link", { name: "Analytics", exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/analytics/);
  });

  test("T1-F1-05: Navigate to Settings", async ({ page }) => {
    const link = page.getByRole("link", { name: "Settings", exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/settings/);
  });
});

test.describe("App Shell & Sidebar Navigation - Tier 2", () => {
  test("T2-F1-01: Responsive Viewport Check", async ({ page }) => {
    await page.goto("/");
    // Resize to 1024 width
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(100);
    const homeLink = page.getByRole("link", { name: "Home", exact: true });
    await expect(homeLink).toBeVisible();

    // Resize to 1920 width
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(100);
    await expect(homeLink).toBeVisible();
  });

  test("T2-F1-02: Keyboard Nav Focus Rings", async ({ page }) => {
    await page.goto("/");
    await page.locator("button:visible, a[href]:visible").first().waitFor({ state: "visible" });
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("T2-F1-03: Custom 404 Error Boundary", async ({ page }) => {
    await page.goto("/invalid-page");
    const notFoundHeader = page.getByText("Page not found", { exact: false });
    await expect(notFoundHeader).toBeVisible();
    const goHomeLink = page.getByRole("link", { name: "Go home", exact: true });
    await expect(goHomeLink).toBeVisible();
    await goHomeLink.click();
    await expect(page).toHaveURL("/");
  });

  test("T2-F1-04: Custom Scrollbar Check", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    const overflowX = await body.evaluate(
      (el) => window.getComputedStyle(el).overflowX,
    );
    expect(overflowX).not.toBe("scroll");
  });

  test("T2-F1-05: Page Refresh Preservation", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await page.reload();
    await expect(page).toHaveURL(/\/settings/);
    const link = page.getByRole("link", { name: "Settings", exact: true });
    await expect(link).toBeVisible();
  });
});
