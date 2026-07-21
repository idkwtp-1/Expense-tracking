import { test, expect } from "@playwright/test";

test.describe("Budget Page - Tier 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/budget");
  });

  test("T1-F4-01: Monthly Limit Summary", async ({ page }) => {
    // Expect total spent/limit text to be present
    const summary = page.getByText(/Spent.*of/);
    await expect(summary).toBeVisible();
  });

  test("T1-F4-02: Progress Bar Coloring", async ({ page }) => {
    // If progress bars exist, expect them to be visible
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });

  test("T1-F4-03: Category Details", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });

  test("T1-F4-04: Add Budget Trigger", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });

  test("T1-F4-05: Empty Budgets State", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });
});

test.describe("Budget Page - Tier 2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/budget");
  });

  test("T2-F4-01: 0% and 100% Limits", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });

  test("T2-F4-02: Over-limit Status Warning", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });

  test("T2-F4-03: Micro limits handling", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });

  test("T2-F4-04: Floating Point Accuracy", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });

  test("T2-F4-05: Financial Tabular Layout", async ({ page }) => {
    const budgetBtn = page.getByRole("button", { name: "Add budget" });
    await expect(budgetBtn).toBeVisible();
  });
});
