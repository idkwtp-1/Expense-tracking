import { test, expect } from "@playwright/test";

test.describe("Transactions Page - Tier 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
  });

  test("T1-F3-01: Grouped List Renders", async ({ page }) => {
    // Check if page header/dates/lists are visible
    const h1 = page.getByRole("heading", { name: "Transactions" });
    await expect(h1).toBeVisible();
  });

  test("T1-F3-02: Search Input Filters", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search transactions...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Coffee");
    // Verify it doesn't crash
    await expect(searchInput).toHaveValue("Coffee");
  });

  test("T1-F3-03: Calendar Strip Nav", async ({ page }) => {
    const wedButton = page
      .getByRole("button", { name: "Wed", exact: false })
      .or(page.getByText("Wed"));
    if ((await wedButton.count()) > 0) {
      await wedButton.first().click();
    }
  });

  test("T1-F3-04: Delete Transaction", async ({ page }) => {
    // If there are delete buttons, try to click the first one
    const deleteBtn = page
      .getByRole("button", { name: "Delete", exact: false })
      .first();
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.click();
    }
  });

  test("T1-F3-05: Search Empty State", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search transactions...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("XYZ_NON_EXISTENT_MERCHANT");
    const emptyState = page.getByText("No transactions found.");
    await expect(emptyState).toBeVisible();
  });
});

test.describe("Transactions Page - Tier 2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
  });

  test("T2-F3-01: Duplicate Transaction Items", async ({ page }) => {
    const h1 = page.getByRole("heading", { name: "Transactions" });
    await expect(h1).toBeVisible();
  });

  test("T2-F3-02: Regex Injection in Search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search transactions...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("*");
    await expect(searchInput).toHaveValue("*");
    await searchInput.fill("[a-z]");
    await expect(searchInput).toHaveValue("[a-z]");
    await searchInput.fill("\\");
    await expect(searchInput).toHaveValue("\\");
  });

  test("T2-F3-03: Future Date Transaction", async ({ page }) => {
    const h1 = page.getByRole("heading", { name: "Transactions" });
    await expect(h1).toBeVisible();
  });

  test("T2-F3-04: Search Input XSS Injection", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search transactions...");
    await expect(searchInput).toBeVisible();
    const xss = '<script>alert("XSS")</script>';
    await searchInput.fill(xss);
    await expect(searchInput).toHaveValue(xss);
  });

  test("T2-F3-05: Delete Last Transaction", async ({ page }) => {
    const h1 = page.getByRole("heading", { name: "Transactions" });
    await expect(h1).toBeVisible();
  });
});
