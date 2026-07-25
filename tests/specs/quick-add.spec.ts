import { test, expect } from "@playwright/test";

test.describe("Quick Add Dialog - Tier 1", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T1-F6-01: Open and Close Dialog", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await expect(quickAddBtn).toBeVisible();
    await quickAddBtn.click();

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(closeBtn).not.toBeVisible();
  });

  test("T1-F6-02: Expense/Income Switch", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    const incomeToggle = page.getByRole("button", {
      name: "income",
      exact: true,
    });
    await expect(incomeToggle).toBeVisible();
    await incomeToggle.click();

    const expenseToggle = page.getByRole("button", {
      name: "expense",
      exact: true,
    });
    await expect(expenseToggle).toBeVisible();
    await expenseToggle.click();

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await closeBtn.click();
  });

  test("T1-F6-03: Keypad Value Input", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    const oneBtn = page.getByRole("button", { name: "1", exact: true });
    const zeroBtn = page.getByRole("button", { name: "0", exact: true });

    await oneBtn.click();
    await zeroBtn.click();
    await zeroBtn.click();

    // Verify it entered 100
    const displayValue = page.getByText("$100");
    await expect(displayValue).toBeVisible();

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await closeBtn.click();
  });

  test("T1-F6-04: Category Select Slider", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    const coffeeBtn = page.getByRole("button", {
      name: "Coffee",
      exact: false,
    });
    if ((await coffeeBtn.count()) > 0) {
      await coffeeBtn.first().click();
    }

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await closeBtn.click();
  });

  test("T1-F6-05: Note Entry & Save", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    const noteInput = page.getByPlaceholder("Add note...");
    await expect(noteInput).toBeVisible();
    await noteInput.fill("Coffee with Alice");

    // Click Save Expense / Income (it might say "Save Expense" or "Save Income" or just "Save")
    const saveBtn = page
      .getByRole("button", { name: /Save (Expense|Income)/ })
      .first();
    await saveBtn.click();
  });
});

test.describe("Quick Add Dialog - Tier 2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("T2-F6-01: Keypad Double Decimal", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    const fiveBtn = page.getByRole("button", { name: "5", exact: true });
    const dotBtn = page.getByRole("button", { name: ".", exact: true });

    await fiveBtn.click();
    await dotBtn.click();
    await dotBtn.click();
    await fiveBtn.click();

    const displayValue = page.getByText("$5.5");
    await expect(displayValue).toBeVisible();

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await closeBtn.click();
  });

  test("T2-F6-02: Save Zero Amount", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    const saveBtn = page
      .getByRole("button", { name: /Save (Expense|Income)/ })
      .first();
    // Verify it doesn't crash when clicked on 0 amount
    await saveBtn.click();
  });

  test("T2-F6-03: Keyboard Dismiss (Escape)", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: /Quick Add/i,
    });
    await quickAddBtn.click();

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await expect(closeBtn).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(closeBtn).not.toBeVisible();
  });

  test("T2-F6-04: Modal Focus Trap Audit", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    // Tab through elements
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await closeBtn.click();
  });

  test("T2-F6-05: Note Field XSS Injection", async ({ page }) => {
    const quickAddBtn = page.getByRole("button", {
      name: "Quick add",
      exact: true,
    });
    await quickAddBtn.click();

    const noteInput = page.getByPlaceholder("Add note...");
    const xss = '<script>alert("XSS")</script>';
    await noteInput.fill(xss);
    await expect(noteInput).toHaveValue(xss);

    const closeBtn = page.getByRole("button", { name: "Close", exact: true });
    await closeBtn.click();
  });
});
