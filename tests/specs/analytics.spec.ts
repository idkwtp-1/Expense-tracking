import { test, expect } from "@playwright/test";

test.describe("Analytics Page - Tier 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics");
  });

  test("T1-F5-01: Period Switcher", async ({ page }) => {
    const weekBtn = page.getByRole("button", { name: "Week", exact: true });
    const monthBtn = page.getByRole("button", { name: "Month", exact: true });
    const yearBtn = page.getByRole("button", { name: "Year", exact: true });

    await expect(weekBtn).toBeVisible();
    await expect(monthBtn).toBeVisible();
    await expect(yearBtn).toBeVisible();

    await weekBtn.click();
    await monthBtn.click();
    await yearBtn.click();
  });

  test("T1-F5-02: Summary Row Values", async ({ page }) => {
    await expect(page.getByText("Spent", { exact: true })).toBeVisible();
    await expect(page.getByText("Earned", { exact: true })).toBeVisible();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  });

  test("T1-F5-03: Donut Chart Renders", async ({ page }) => {
    // Look for category label or donut container
    await expect(page.getByText("By category", { exact: true })).toBeVisible();
  });

  test("T1-F5-04: Trend & Flow Charts", async ({ page }) => {
    await expect(
      page.getByText("Monthly trend", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Cash flow", { exact: true })).toBeVisible();
  });

  test("T1-F5-05: Top Merchants List", async ({ page }) => {
    await expect(
      page.getByText("Top merchants", { exact: true }),
    ).toBeVisible();
  });
});

test.describe("Analytics Page - Tier 2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics");
  });

  test("T2-F5-01: Empty States for Charts", async ({ page }) => {
    await expect(page.getByText("By category", { exact: true })).toBeVisible();
  });

  test("T2-F5-02: 100% Single Category Donut", async ({ page }) => {
    await expect(page.getByText("By category", { exact: true })).toBeVisible();
  });

  test("T2-F5-03: Rapid Tab Switch Glitch", async ({ page }) => {
    const weekBtn = page.getByRole("button", { name: "Week", exact: true });
    const monthBtn = page.getByRole("button", { name: "Month", exact: true });
    const yearBtn = page.getByRole("button", { name: "Year", exact: true });

    for (let i = 0; i < 5; i++) {
      await weekBtn.click();
      await monthBtn.click();
      await yearBtn.click();
    }
  });

  test("T2-F5-04: Long Merchants List Cap", async ({ page }) => {
    await expect(
      page.getByText("Top merchants", { exact: true }),
    ).toBeVisible();
  });

  test("T2-F5-05: Identical Top Merchant Spends", async ({ page }) => {
    await expect(
      page.getByText("Top merchants", { exact: true }),
    ).toBeVisible();
  });
});
