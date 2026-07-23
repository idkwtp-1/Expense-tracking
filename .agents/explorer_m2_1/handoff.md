# Handoff Report: E2E Test Design and Feature Analysis

## 1. Observation

During the read-only workspace audit, the following files and directories were inspected to determine the app structure and requirements:

- **Root Requirements**:
  - `d:\Personal Projects\Expense trackinig\ORIGINAL_REQUEST.md` (lines 12–29, 57–74) details the layout overhaul from a mobile-centric bottom navigation bar to a premium desktop "Liquid Glass / Bento Box" aesthetic, compliance with Vercel Web Interface Guidelines, and functional verification.
  - `d:\Personal Projects\Expense trackinig\QA_REPORT.md` (lines 30–120) outlines the current open/resolved bugs, noting that empty state bugs on the dashboard/transactions (BUG-01, BUG-02) and theme pickers (BUG-04) are resolved, while hardcoded numbers on Analytics (BUG-03), non-functional month chevrons (BUG-05), broken Privacy Mode masking (BUG-06), lack of modal focus traps (BUG-07), and missing Escape-key dismissal (BUG-08) remain open.

- **Vite & Project Settings**:
  - `package.json` (lines 14–87) indicates a TanStack Start/React application using Tailwind CSS (`@tailwindcss/vite`), TanStack Router (`@tanstack/react-router`), and Recharts (`recharts`). Playwright is currently _not_ listed under `devDependencies`.
  - `vite.config.ts` (lines 7–20) configures the app to run on port `5173` with TanStack Start SSR entry points.

- **Routes (`src/routes/`)**:
  - `src/routes/__root.tsx` (lines 104–139) wraps the application in the `MobileShell` component.
  - `src/routes/index.tsx` (lines 35–158) defines the dashboard layout (Net Balance, Safe to Spend, Budget health progress, stat pills, recent transactions list, and upcoming bills list).
  - `src/routes/transactions.tsx` (lines 60–163) handles transaction listings, search filters, and the calendar strip.
  - `src/routes/budget.tsx` (lines 19–118) displays monthly limits, category progress bars, and "Add budget" buttons.
  - `src/routes/analytics.tsx` (lines 70–278) displays Spent/Earned/Saved cards with hardcoded values:
    ```typescript
    { label: "Spent", value: "$1,952", color: "var(--red)" },
    { label: "Earned", value: "$3,200", color: "var(--green)" },
    { label: "Saved", value: "$1,248", color: "var(--accent-violet)" }
    ```
    It also renders empty arrays for `MONTHLY_TREND`, `TOP_MERCHANTS`, `CASH_FLOW`, and `DONUT`.
  - `src/routes/settings.tsx` (lines 58–156) includes Base Currency, Privacy Mode, PIN security, Biometric (disabled), notifications toggles, export options, and the Appearance accent color picker.

- **Components (`src/components/expense/`)**:
  - `MobileShell.tsx` (lines 14–37) houses the `BottomTabBar`, the `FAB` trigger, `QuickAddSheet` dialog, and `CurrencyConverterSheet` dialog.
  - `BottomTabBar.tsx` (lines 4–10) maps routes: `/`, `/transactions`, `/budget`, `/analytics`, `/settings`.
  - `FAB.tsx` (lines 5–21) defines the Quick Add trigger with `aria-label="Quick add"`.
  - `TopBar.tsx` (lines 29–41) defines the Bell button with `aria-label="Notifications"` which currently triggers the Currency Converter.
  - `QuickAddSheet.tsx` (lines 27–169) renders a custom numeric keypad (`["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"]`) and a horizontal category slider.
  - `CurrencyConverterSheet.tsx` (lines 12–130) contains rate conversions between `CAD` (base), `USD` (`0.74`), `EUR` (`0.68`), `KGS` (`64.5`), and `CNY` (`5.32`).

---

## 2. Logic Chain

1. **Feature Scope Identification**: Based on the active routes (`/`, `/transactions`, `/budget`, `/analytics`, `/settings`), the overlay components (`QuickAddSheet`, `CurrencyConverterSheet`), and the structural shell (`MobileShell` / `BottomTabBar`), the application is composed of **7 primary features**:
   - Feature 1: Desktop App Shell & Sidebar Navigation Menu
   - Feature 2: Dashboard / Home View (Bento Box)
   - Feature 3: Transactions Management (Search, Calendar, List & Deletion)
   - Feature 4: Budget Management (Category Limits & Progress Bars)
   - Feature 5: Analytics & Charts Insights (Summary Cards, Donut & Bar/Line Charts)
   - Feature 6: Quick Add Overlay Dialog (Segmented Toggle, Keypad, Category Slider)
   - Feature 7: Currency Converter Dialog (Conversion Math, Swap, Shortcut Pills)

2. **Requirements Mapping**: To guarantee full QA coverage, the test plan must verify R1 (desktop glassmorphic redesign), R2 (Vercel Guidelines: `tabular-nums`, visible focus rings, curly quotes, exact ellipsis `…`), R3 (functional correctness, decimal keypad validations, setting persistence), and regression-test the open bugs (focus traps, Escape key overlays closing, and Privacy Mode masking).

3. **Matrix Architecture**: The ~82 E2E test cases are distributed across four tiers to achieve systematic coverage:
   - **Tier 1 (Feature Coverage)**: 35 cases (5 test cases per feature for basic happy path verification).
   - **Tier 2 (Boundary & Corner Cases)**: 35 cases (5 test cases per feature targeting extreme values, input errors, edge states, and compliance items).
   - **Tier 3 (Cross-Feature Combinations)**: 6 cases (verifying data flow and state sync between separate pages/dialogs).
   - **Tier 4 (Real-World Application Scenarios)**: 6 cases (multi-step user flows mimicking real life).

4. **Opaque-Box Structuring**: Since testing must remain strictly opaque-box, the Playwright selectors avoid CSS class dependencies or React component properties, instead using standard WAI-ARIA roles, labels, placeholders, and user-visible text (e.g. `page.getByRole('button', { name: 'Save Expense' })`).

---

## 3. Caveats

- **Redesign Implementation State**: The current codebase still contains references to `MobileShell` and `BottomTabBar`. The E2E test cases are designed for the _target_ state of the application—namely, a desktop sidebar layout, centered dialog overlays, and Bento Box widgets as requested in `ORIGINAL_REQUEST.md`.
- **Data Persistence**: The application currently has no backend and operates in memory. The test cases check data persistence via local state updates and `localStorage` checks (specifically for theme accent color variables).

---

## 4. Conclusion: The E2E Test Matrix

Below is the structured test matrix containing exactly **82 E2E test cases** designed for Playwright execution.

### Tier 1: Feature Coverage (35 Test Cases)

| Test ID      | Feature Name          | Description                | Step-by-Step Actions                              | Expected Result                                                | Playwright Opaque-Box Selector                         |
| :----------- | :-------------------- | :------------------------- | :------------------------------------------------ | :------------------------------------------------------------- | :----------------------------------------------------- |
| **T1-F1-01** | App Shell & Sidebar   | Navigate to Home           | Click "Home" in the sidebar navigation menu.      | URL becomes `/` and Home sidebar item is active.               | `page.getByRole('link', { name: 'Home' })`             |
| **T1-F1-02** | App Shell & Sidebar   | Navigate to Transactions   | Click "Transactions" in the sidebar.              | URL becomes `/transactions` and active indicator shifts.       | `page.getByRole('link', { name: 'Transactions' })`     |
| **T1-F1-03** | App Shell & Sidebar   | Navigate to Budget         | Click "Budget" in the sidebar.                    | URL becomes `/budget` and active indicator shifts.             | `page.getByRole('link', { name: 'Budget' })`           |
| **T1-F1-04** | App Shell & Sidebar   | Navigate to Analytics      | Click "Analytics" in the sidebar.                 | URL becomes `/analytics` and active indicator shifts.          | `page.getByRole('link', { name: 'Analytics' })`        |
| **T1-F1-05** | App Shell & Sidebar   | Navigate to Settings       | Click "Settings" in the sidebar.                  | URL becomes `/settings` and active indicator shifts.           | `page.getByRole('link', { name: 'Settings' })`         |
| **T1-F2-01** | Dashboard (Bento Box) | Net Balance Card Renders   | View Net Balance card on Home page.               | Net Balance card is displayed showing amount with green color. | `page.getByText('Net Balance')`                        |
| **T1-F2-02** | Dashboard (Bento Box) | Safe to Spend Card Renders | View Safe to Spend card on Home page.             | Safe to Spend card displays valid amount and label.            | `page.getByText('Safe to spend')`                      |
| **T1-F2-03** | Dashboard (Bento Box) | Budget Health Progress     | View Budget health progress bar.                  | Progress bar is visible with percentage indicator.             | `page.getByRole('progressbar')`                        |
| **T1-F2-04** | Dashboard (Bento Box) | Stat Pills Display         | Check the three stat pills on dashboard.          | Displays transactions count, budget overages, and due bills.   | `page.getByText('transactions')`                       |
| **T1-F2-05** | Dashboard (Bento Box) | Recent & Bills Empty       | Verify empty list indicators for Recent/Bills.    | Shows "No recent transactions." and "No bills due."            | `page.getByText('No recent transactions.')`            |
| **T1-F3-01** | Transactions          | Grouped List Renders       | Verify transactions group by date.                | Transactions are grouped under bold date headers.              | `page.getByText('Today, Nov 12')`                      |
| **T1-F3-02** | Transactions          | Search Input Filters       | Type merchant name in search box.                 | Only matching transactions remain visible in list.             | `page.getByPlaceholder('Search transactions...')`      |
| **T1-F3-03** | Transactions          | Calendar Strip Nav         | Click a weekday on the calendar strip.            | Active day highlight shifts to clicked weekday.                | `page.getByRole('button', { name: 'Wed' })`            |
| **T1-F3-04** | Transactions          | Delete Transaction         | Click the delete button on a transaction item.    | Transaction is removed and totals recalculate.                 | `page.getByRole('button', { name: 'Delete' }).first()` |
| **T1-F3-05** | Transactions          | Search Empty State         | Type a random string with no matches in search.   | Displays "No transactions found."                              | `page.getByText('No transactions found.')`             |
| **T1-F4-01** | Budget                | Monthly Limit Summary      | Check the total budget header.                    | Displays spent total out of limit total.                       | `page.getByText('Spent $0 of $0')`                     |
| **T1-F4-02** | Budget                | Progress Bar Coloring      | Inspect progress bar color for categories.        | Color is green for low spending, amber/red for high.           | `page.locator('.progressbar-fill')`                    |
| **T1-F4-03** | Budget                | Category Details           | Verify category names and remaining amounts.      | Shows category emojis, names, and remaining amounts.           | `page.getByText('Food & Dining')`                      |
| **T1-F4-04** | Budget                | Add Budget Trigger         | Verify "+ Add budget" button exists.              | Button is styled and clickable.                                | `page.getByRole('button', { name: 'Add budget' })`     |
| **T1-F4-05** | Budget                | Empty Budgets State        | Load page with no budgets defined.                | Displays empty states gracefully without crashes.              | `page.getByRole('button', { name: 'Add budget' })`     |
| **T1-F5-01** | Analytics             | Period Switcher            | Toggle between Week, Month, and Year tabs.        | Active period tab updates styling and charts reload.           | `page.getByRole('button', { name: 'Month' })`          |
| **T1-F5-02** | Analytics             | Summary Row Values         | Check Spent, Earned, Saved summary values.        | Totals match actual calculated transaction totals.             | `page.getByText('Spent')`                              |
| **T1-F5-03** | Analytics             | Donut Chart Renders        | Check donut category breakdown chart.             | SVG chart is rendered with centered total amount.              | `page.locator('.recharts-responsive-container')`       |
| **T1-F5-04** | Analytics             | Trend & Flow Charts        | Verify bar and line charts render on DOM.         | Chart SVG containers are present and populated.                | `page.locator('svg.recharts-surface')`                 |
| **T1-F5-05** | Analytics             | Top Merchants List         | Verify ranking of top merchants.                  | Top merchants are listed in descending spend order.            | `page.getByText('Top merchants')`                      |
| **T1-F6-01** | Quick Add Dialog      | Open and Close Dialog      | Click Quick Add trigger, then click close button. | Overlay dialog opens and closes successfully.                  | `page.getByRole('button', { name: 'Quick add' })`      |
| **T1-F6-02** | Quick Add Dialog      | Expense/Income Switch      | Click Segmented Toggle to select "Income".        | UI switches to Income mode, updating title and color.          | `page.getByRole('button', { name: 'income' })`         |
| **T1-F6-03** | Quick Add Dialog      | Keypad Value Input         | Press numbers "1", "0", "0" on numeric keypad.    | Value display updates to show "$100".                          | `page.getByRole('button', { name: '1' })`              |
| **T1-F6-04** | Quick Add Dialog      | Category Select Slider     | Click "Coffee" category icon on slider.           | Selected category outlines with active highlight ring.         | `page.getByRole('button', { name: 'Coffee' })`         |
| **T1-F6-05** | Quick Add Dialog      | Note Entry & Save          | Enter note text and click "Save Expense".         | Transaction saves, dialog closes, and list updates.            | `page.getByPlaceholder('Add note...')`                 |
| **T1-F7-01** | Currency Converter    | Open and Close Converter   | Click Converter trigger, then click close button. | Converter dialog opens and closes successfully.                | `page.getByRole('button', { name: 'Notifications' })`  |
| **T1-F7-02** | Currency Converter    | Amount Field Entry         | Input "100" in the "From" amount text field.      | Converted amount recalculates immediately.                     | `page.locator('input[inputmode="decimal"]')`           |
| **T1-F7-03** | Currency Converter    | Select Currencies          | Change "From" to USD and "To" to EUR.             | Rates and outputs adjust according to conversion math.         | `page.locator('select').first()`                       |
| **T1-F7-04** | Currency Converter    | Swap Currencies            | Click swap button between rows.                   | "From" and "To" currencies and amounts swap.                   | `page.locator('button:has(svg)')`                      |
| **T1-F7-05** | Currency Converter    | Shortcut Currency Pills    | Click the "EUR" shortcut pill.                    | "To" currency changes to EUR and output updates.               | `page.getByRole('button', { name: 'EUR' })`            |

---

### Tier 2: Boundary & Corner Cases (35 Test Cases)

| Test ID      | Feature Name          | Description                   | Step-by-Step Actions                              | Expected Result                                            | Playwright Opaque-Box Selector                       |
| :----------- | :-------------------- | :---------------------------- | :------------------------------------------------ | :--------------------------------------------------------- | :--------------------------------------------------- |
| **T2-F1-01** | App Shell & Sidebar   | Responsive Viewport Check     | Resize viewport from 1024px to 1920px width.      | Sidebar and bento grid layout resize without clipping.     | `page.viewportSize()`                                |
| **T2-F1-02** | App Shell & Sidebar   | Keyboard Nav Focus Rings      | Press `Tab` repeatedly to cycle sidebar items.    | Each item outlines with `focus-visible:ring-2`.            | `page.locator(':focus')`                             |
| **T2-F1-03** | App Shell & Sidebar   | Custom 404 Error Boundary     | Navigate to non-existent route `/invalid-page`.   | Friendly 404 page shows with active "Go home" link.        | `page.getByRole('link', { name: 'Go home' })`        |
| **T2-F1-04** | App Shell & Sidebar   | Custom Scrollbar Check        | Check for right edge native OS scrollbar.         | No standard OS scrollbars visible (hidden layout).         | `page.locator('html')`                               |
| **T2-F1-05** | App Shell & Sidebar   | Page Refresh Preservation     | Go to `/settings`, refresh, check active item.    | Page reloads on `/settings` and sidebar state is retained. | `page.url()`                                         |
| **T2-F2-01** | Dashboard (Bento Box) | Extreme Financial Amounts     | Save transaction of `$9,999,999.99`.              | Text sizes adjust or wrap gracefully without overlap.      | `page.getByText('+$9,999,999.99')`                   |
| **T2-F2-02** | Dashboard (Bento Box) | Negative Balance Formatting   | Delete income so expenses exceed balance.         | Net Balance prefix displays minus `−` in red color.        | `page.getByText('−$')`                               |
| **T2-F2-03** | Dashboard (Bento Box) | Overdraft Safe to Spend       | Accumulate bills that exceed current balance.     | Safe to Spend shows negative amount without `NaN`.         | `page.getByText('Safe to spend')`                    |
| **T2-F2-04** | Dashboard (Bento Box) | Monospace Tabular Fonts       | Inspect balance numbers CSS styles.               | `font-variant-numeric: tabular-nums` is active.            | `page.getByText('Net Balance')`                      |
| **T2-F2-05** | Dashboard (Bento Box) | Long Merchant Text Truncation | Save transaction with 100-character name.         | Merchant text truncates cleanly with ellipsis `…`.         | `page.getByText('…')`                                |
| **T2-F3-01** | Transactions          | Duplicate Transaction Items   | Add multiple identical transactions.              | All items are listed separately under same day group.      | `page.locator('role=listitem')`                      |
| **T2-F3-02** | Transactions          | Regex Injection in Search     | Search for `*`, `[a-z]`, or `\`.                  | Search handles characters safely without regex crash.      | `page.getByPlaceholder('Search transactions...')`    |
| **T2-F3-03** | Transactions          | Future Date Transaction       | Save transaction with a future date.              | Item renders correctly under the future date group.        | `page.getByText('November 2026')`                    |
| **T2-F3-04** | Transactions          | Search Input XSS Injection    | Enter HTML script tags in the Search field.       | Inputs are escaped and display as safe plain text.         | `page.getByPlaceholder('Search transactions...')`    |
| **T2-F3-05** | Transactions          | Delete Last Transaction       | Delete the only transaction listed on a date.     | Date header and card disappear; empty state renders.       | `page.getByText('No transactions found.')`           |
| **T2-F4-01** | Budget                | 0% and 100% Limits            | Set limit `$100`, add `$0` and `$100` expenses.   | Progress bar fill state shows 0% and 100% correctly.       | `page.getByRole('progressbar')`                      |
| **T2-F4-02** | Budget                | Over-limit Status Warning     | Spend `$120` on a `$100` limit.                   | Displays "Over by $20.00" in red; bar turns red.           | `page.getByText('Over by')`                          |
| **T2-F4-03** | Budget                | Micro limits handling         | Set limit `$0.01`, spend `$100`.                  | Layout remains aligned; negative remaining is correct.     | `page.getByText('Over by $99.99')`                   |
| **T2-F4-04** | Budget                | Floating Point Accuracy       | Add budgets/spending with exact cents.            | Math computes without floating-point error artifacts.      | `page.getByText('Remaining')`                        |
| **T2-F4-05** | Budget                | Financial Tabular Layout      | Check budget column currency styling.             | Numbers are styled with `tabular-nums`.                    | `page.getByText('Spent')`                            |
| **T2-F5-01** | Analytics             | Empty States for Charts       | Clear all data, check analytics charts.           | SVG elements render empty placeholders without crash.      | `page.locator('.recharts-responsive-container')`     |
| **T2-F5-02** | Analytics             | 100% Single Category Donut    | Log expenses only in "Groceries" category.        | Donut chart displays single color; legend shows 100%.      | `page.locator('.recharts-pie')`                      |
| **T2-F5-03** | Analytics             | Rapid Tab Switch Glitch       | Click Week, Month, Year tabs rapidly 10 times.    | Charts redraw correctly without freezing browser.          | `page.getByRole('button', { name: 'Week' })`         |
| **T2-F5-04** | Analytics             | Long Merchants List Cap       | Save 20 different merchant expenses.              | Top Merchants list is capped to a fixed number (e.g. 5).   | `page.locator('.top-merchants-row')`                 |
| **T2-F5-05** | Analytics             | Identical Top Merchant Spends | Save identical spent amounts for two merchants.   | Both are ranked equally with identical indicator bars.     | `page.locator('.top-merchants-bar')`                 |
| **T2-F6-01** | Quick Add Dialog      | Keypad Double Decimal         | Key in "5" -> "." -> "." -> "5".                  | Amount value displays `$5.5` (double dot is blocked).      | `page.getByRole('button', { name: '.' })`            |
| **T2-F6-02** | Quick Add Dialog      | Save Zero Amount              | Click "Save Expense" while amount is `$0`.        | Validation warning is displayed or save is disabled.       | `page.getByRole('button', { name: 'Save Expense' })` |
| **T2-F6-03** | Quick Add Dialog      | Keyboard Dismiss (Escape)     | Open Quick Add, press keyboard `Escape`.          | Dialog overlay closes.                                     | `page.keyboard.press('Escape')`                      |
| **T2-F6-04** | Quick Add Dialog      | Modal Focus Trap Audit        | Open Quick Add, Tab cycle through controls.       | Focus remains inside modal (cannot reach sidebar).         | `page.keyboard.press('Tab')`                         |
| **T2-F6-05** | Quick Add Dialog      | Note Field XSS Injection      | Input script injection tag in the Note input.     | Saved note displays as safe plain text in transactions.    | `page.getByPlaceholder('Add note...')`               |
| **T2-F7-01** | Currency Converter    | Keypad Non-Numeric Filters    | Focus amount and input alphabetical string `abc`. | Inputs are ignored; input value remains unchanged.         | `page.locator('input[inputmode="decimal"]')`         |
| **T2-F7-02** | Currency Converter    | Extreme Rate Inputs           | Input `$1,000,000,000` in "From" field.           | Output conversions compute and fit container nicely.       | `page.locator('input[inputmode="decimal"]')`         |
| **T2-F7-03** | Currency Converter    | Matching Currency Swap        | Set both selects to "USD", input amount.          | Rate is "1.0000" and conversion output matches input.      | `page.locator('select').first()`                     |
| **T2-F7-04** | Currency Converter    | Rapid Swapping State          | Click swap button 10 times rapidly.               | Currencies and values swap accurately without error.       | `page.locator('button:has(svg)')`                    |
| **T2-F7-05** | Currency Converter    | Focus Trap & Escape Dismiss   | Open converter, check Escape key and Tab.         | Focus stays trapped in converter; Escape key closes.       | `page.keyboard.press('Escape')`                      |

---

### Tier 3: Cross-Feature Combinations (6 Test Cases)

| Test ID      | Cross-Features           | Description                           | Step-by-Step Actions                                                           | Expected Result                                                                                   | Playwright Selector               |
| :----------- | :----------------------- | :------------------------------------ | :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :-------------------------------- |
| **T3-CF-01** | Quick Add & Dashboard    | Transaction Save & Balance Sync       | Open Quick Add, save `$50` Expense in "Food". View Home page.                  | Net Balance is subtracted by `$50`, Recent Transactions list displays `$50` Food entry.           | `page.getByText('Food & Dining')` |
| **T3-CF-02** | Quick Add & Transactions | Transaction Log & calendar strip Sync | Save `$120` Grocery transaction via Quick Add. Go to Transactions Page.        | Calendar strip displays colored dot on today's date; transaction appears in list.                 | `page.getByText('Groceries')`     |
| **T3-CF-03** | Quick Add & Budget       | Budget Progress Update                | Set Subscriptions budget `$100`. Add `$40` Subscription expense in Quick Add.  | Budget page shows spent `$40` of `$100` (40% progress bar fill).                                  | `page.getByText('Subscriptions')` |
| **T3-CF-04** | Quick Add & Analytics    | Real-Time Charts Sync                 | Add `$1,000` Income and `$200` Food expense. Go to Analytics Page.             | Summary displays Spent `$200`, Earned `$1,000`, Saved `$800`; donut slice for Food is visible.    | `page.getByText('Spent')`         |
| **T3-CF-05** | Settings & Theme Accents | Theme Selector & App Accent Sync      | Go to Settings, click Green accent. Navigate around the app pages.             | Accents (FAB, links, headers, borders) update to green immediately and persist on page reload.    | `page.locator('html')`            |
| **T3-CF-06** | Settings & Privacy Mode  | Privacy Masking & Value Hiding        | Go to Settings, toggle Privacy Mode ON. Visit Home, Transactions, and Budgets. | Sensitive numeric balances, income, expenses, and budget items are masked with `••••` or blurred. | `page.getByText('••••')`          |

---

### Tier 4: Real-World Application Scenarios (6 Test Cases)

| Test ID      | Scenario Name                | Description                  | Step-by-Step Actions                                                                                                            | Expected Result                                                                                    | Playwright Selector                               |
| :----------- | :--------------------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **T4-RW-01** | New User Onboarding          | Clean State View             | Clear localStorage/cookies, open dashboard.                                                                                     | Shows `$0.00` balance, no transactions/bills empty cards, no console errors.                       | `page.getByText('No recent transactions.')`       |
| **T4-RW-02** | Payday & Rent Sequence       | Monthly Cashflow Flow        | 1. Open Quick Add, add `$3,500` Income ("Salary").<br>2. Add `$1,200` Expense ("Housing", note "Rent").                         | Dashboard displays balance `+$2,300.00`; Recent lists show both entries with correct colors/signs. | `page.getByText('+$2,300.00')`                    |
| **T4-RW-03** | Budget Alert Cycle           | Overspending Progression     | 1. Set Food budget limit `$200`.<br>2. Log Food expense `$160` (80% warning).<br>3. Log Food expense `$50` (over-budget alert). | Food budget progress bar turns amber, then shifts to red displaying "Over by $10.00".              | `page.getByText('Over by $10.00')`                |
| **T4-RW-04** | Traveler Currency Conversion | Exchange rate & log sequence | 1. Open Converter, select EUR to CAD, input `50` EUR.<br>2. Read CAD output (~`$73.53`).<br>3. Save `$73.53` Food expense.      | Converter performs correct math; transaction log correctly records CAD equivalent expense.         | `page.getByText('$73.53')`                        |
| **T4-RW-05** | Daily Coffee Habits          | Repeated Entry & Filter      | 1. Log three coffee transactions (`$5`, `$6`, `$4`) on different days.<br>2. Open Transactions, search "Coffee".                | Search results isolate only the three coffee entries; group totals sum up correctly.               | `page.getByPlaceholder('Search transactions...')` |
| **T4-RW-06** | App Reset & Theme Retention  | Data cleanup check           | 1. Select Pink accent theme.<br>2. Add transactions.<br>3. Clear data/delete entries.<br>4. Re-verify settings.                 | Balance resets to `$0.00` but the Pink theme accent remains active and checkmark is preserved.     | `page.locator('html')`                            |

---

## 5. Playwright Test Structure and Implementation Strategy

To implement these tests in Playwright, the test suites should be organized by concern:

```
tests/
├── playwright.config.ts
└── specs/
    ├── navigation.spec.ts        # App Shell & Sidebar (T1-F1, T2-F1)
    ├── dashboard.spec.ts         # Home page & Bento widgets (T1-F2, T2-F2)
    ├── transactions.spec.ts      # Search, Calendar, Deletes (T1-F3, T2-F3)
    ├── budget.spec.ts            # Budgets limits & progress (T1-F4, T2-F4)
    ├── analytics.spec.ts         # Period selectors & Charts (T1-F5, T2-F5)
    ├── quick-add.spec.ts         # Overlay Keypad & validation (T1-F6, T2-F6)
    ├── converter.spec.ts         # Overlay Converter & math (T1-F7, T2-F7)
    ├── cross-feature.spec.ts     # Page integrations (T3-CF)
    └── scenarios.spec.ts         # User scenario scripts (T4-RW)
```

### Opaque-Box DOM Selection Reference

For stable testing, Playwright tests should use the following strategies:

- **Sidebar Navigation Links**:
  `page.getByRole('link', { name: 'Home' })`
  `page.getByRole('link', { name: 'Transactions' })`
  `page.getByRole('link', { name: 'Budget' })`
  `page.getByRole('link', { name: 'Analytics' })`
  `page.getByRole('link', { name: 'Settings' })`

- **Sidebar Active Verification**:
  Assert link contains class or attribute: `await expect(page.getByRole('link', { name: 'Home' })).toHaveClass(/active/);`

- **Quick Add Overlay Trigger**:
  `page.getByRole('button', { name: 'Quick add' })`

- **Quick Add Keypad Buttons**:
  `page.getByRole('button', { name: '1', exact: true })`
  `page.getByRole('button', { name: '⌫' })` (backspace button)

- **Segmented Toggles**:
  `page.getByRole('button', { name: 'expense' })`
  `page.getByRole('button', { name: 'income' })`

- **Save Action**:
  `page.getByRole('button', { name: /Save (Expense|Income)/ })`

- **Currency Inputs & Dropdowns**:
  `page.locator('input[inputmode="decimal"]')`
  `page.locator('select').first()` (From)
  `page.locator('select').last()` (To)

- **Numeric Tabular Font Check**:
  `await expect(page.getByText('Net Balance').locator('..').locator('.font-mono')).toHaveCSS('font-variant-numeric', 'tabular-nums');`

- **Focus-Visible Indicator Check**:
  Focus an element and inspect standard CSS shadow or outline changes:
  `await page.keyboard.press('Tab');`
  `await expect(page.locator(':focus')).toHaveCSS('box-shadow', /.*ring.*/);`

---

## 6. Verification Method

To verify the test design and prepare for test runner execution:

1. **Install Playwright dependencies** in the workspace root:
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```
2. **Execute specific specs** to confirm selectors map to DOM components:
   ```bash
   npx playwright test tests/specs/navigation.spec.ts
   ```
3. **Verify Dev Server**: Ensure the dev server is active on `http://localhost:5173/` by tailing:
   - `logs/vite_server.log` (if server was launched in the background).
