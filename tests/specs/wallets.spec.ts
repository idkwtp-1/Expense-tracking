import { test, expect } from "@playwright/test";

test.describe("Wallets E2E Tests - Tier 1", () => {
  test("T1-F8-01: Wallet Auto-Create & Full Lifecycle Flow", async ({ page }) => {
    // -------------------------------------------------------------
    // 1. Auto-Create Wallet via Quick Add Income
    // -------------------------------------------------------------
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Open Quick Add Dialog
    const quickAddBtn = page.getByRole("button", { name: "Quick add" }).first();
    await expect(quickAddBtn).toBeVisible({ timeout: 10000 });
    await quickAddBtn.click();

    // Switch to Income Mode
    const incomeTab = page.getByRole("button", { name: "income", exact: true });
    await incomeTab.click();

    // Select EUR currency
    const currencySelect = page.getByRole("combobox", { name: "Transaction Currency" });
    await currencySelect.selectOption("EUR");

    // Enter 1000 using keypad
    const keypad1 = page.getByRole("button", { name: "1", exact: true });
    const keypad0 = page.getByRole("button", { name: "0", exact: true });
    await keypad1.click();
    await keypad0.click();
    await keypad0.click();
    await keypad0.click();

    // Save Income
    const saveIncomeBtn = page.getByRole("button", { name: "Save Income", exact: true });
    await saveIncomeBtn.click();

    // -------------------------------------------------------------
    // 2. Verify Auto-Created Wallet & Log Spend
    // -------------------------------------------------------------
    await page.goto("/wallets");

    // Verify EUR wallet is created and visible
    const walletListItem = page.getByText("EUR", { exact: true }).first();
    await expect(walletListItem).toBeVisible();

    await walletListItem.click();
    await expect(page).toHaveURL(/\/wallets\/.+/);

    // Verify initial balance is 1,000 EUR
    await expect(page.getByText(/1,?000(\.00)? EUR/).first()).toBeVisible();

    // Open Log Spend Sheet
    const logSpendBtn = page.getByRole("button", { name: "Log Spend", exact: true });
    await expect(logSpendBtn).toBeVisible();
    await logSpendBtn.click();

    // Enter 150 using keypad
    const keypad5 = page.getByRole("button", { name: "5", exact: true });
    await keypad1.click();
    await keypad5.click();
    await keypad0.click();

    // Fill note
    const spendNoteInput = page.getByPlaceholder("Add spend note...");
    await spendNoteInput.fill("Dinner at Cafe");

    // Click Save Spend Entry
    const saveSpendBtn = page.getByRole("button", { name: "Save Spend Entry", exact: true });
    await saveSpendBtn.click();

    // Verify spend entry is listed
    const activityItem = page.getByText("Dinner at Cafe").first();
    await expect(activityItem).toBeVisible();

    // Verify remaining balance updated to 850
    await expect(page.getByText("850.00 EUR").first()).toBeVisible();



    // -------------------------------------------------------------
    // 4. Archive Wallet
    // -------------------------------------------------------------
    const archiveBtn = page.locator("button").filter({ hasText: "Archive" }).or(page.getByRole("button", { name: /archive/i }));
    await expect(archiveBtn).toBeVisible();
    await archiveBtn.click();
    
    // Verify it switched to Unarchive
    await expect(page.getByText("Unarchive Wallet")).toBeVisible();
    
    // Click back button
    const backBtn = page.locator("a[aria-label='Back to Wallets']");
    await backBtn.click();
    await expect(page).toHaveURL(/\/wallets$/);

    // Expand Archived Wallets
    const archivedGroupBtn = page.getByRole("button", { name: /Archived Wallets/ });
    await expect(archivedGroupBtn).toBeVisible();
    await archivedGroupBtn.click({ force: true });

    // Verify EUR wallet is in archive
    const archivedItem = page.locator("div.space-y-3").getByText("EUR").first();
    await expect(archivedItem).toBeVisible();
  });
});
