import { test, expect } from "@playwright/test";

test.describe("Wallet Converter - Tier 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T1-F7-01: Open Empty Converter", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Wallet Converter", exact: true }).first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const header = page.getByRole("heading", { name: "Wallet Converter" });
    await expect(header).toBeVisible();
    
    // Verify empty state text
    await expect(page.getByText("You have no active wallets to convert from.")).toBeVisible();

    const overlay = page.locator(".fixed.inset-0 > div").first();
    await overlay.click({ force: true });
    await expect(header).not.toBeVisible();
  });

  test("T1-F7-02: Add Income & Convert Wallet", async ({ page }) => {
    // 1. Add EUR Income to create a wallet
    const quickAddBtn = page.getByRole("button", { name: "Quick add" }).first();
    await quickAddBtn.click();
    
    // Switch to income
    await page.getByRole("button", { name: "income", exact: true }).click();
    
    // Select EUR
    const selectCurrency = page.getByRole("combobox", { name: "Transaction Currency" });
    await selectCurrency.selectOption("EUR");
    
    // Type amount 500
    const keypad5 = page.getByRole("button", { name: "5", exact: true });
    const keypad0 = page.getByRole("button", { name: "0", exact: true });
    await keypad5.click();
    await keypad0.click();
    await keypad0.click();
    
    // Save
    await page.getByRole("button", { name: "Save Income", exact: true }).click();
    
    // 2. Open Wallet Converter
    const converterBtn = page.getByRole("button", { name: "Wallet Converter", exact: true }).first();
    await converterBtn.click();
    
    // Check that From contains EUR
    const fromSelect = page.locator("select").first();
    await expect(fromSelect).toHaveValue("EUR");
    
    // Type 100 in amount input
    const amountInput = page.locator('input[inputmode="decimal"]').first();
    await amountInput.fill("100");
    await expect(amountInput).toHaveValue("100");
    
    // Set To to JPY FIRST (because changing currency clears manual rate)
    const toSelect = page.locator("select").last();
    await toSelect.selectOption("JPY");
    
    // Set manual rate
    const rateInput = page.getByRole("textbox", { name: "Exchange Rate" });
    await rateInput.fill("1.5");
    
    // Verify calculation (100 * 1.5 = 150)
    await expect(page.getByText("150.00").first()).toBeVisible();
    
    // Convert & Transfer
    await page.getByRole("button", { name: "Convert & Transfer" }).click();
    
    // 3. Verify wallets updated
    await page.goto("/wallets");
    // Original EUR wallet should have 400 left
    await expect(page.locator("text=EUR").first()).toBeVisible();
    await expect(page.locator("text=400.00 EUR").first()).toBeVisible();
    
    // New JPY wallet should be created with 150
    await expect(page.locator("text=JPY").first()).toBeVisible();
    await expect(page.locator("text=150.00 JPY").first()).toBeVisible();
  });
});

