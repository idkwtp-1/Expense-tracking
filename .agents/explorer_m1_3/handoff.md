# Handoff Report — Accessibility & UI Guidelines Audit (Explorer 3)

This report details the findings and recommendations regarding Vercel Web Interface Guidelines and accessibility compliance across the Expense Tracker's current shell, navigation, and dashboard components.

---

## 1. Observation

We directly observed the following files and code patterns in the workspace:

### A. Icon-Only Buttons Lacking Descriptive Accessible Names

- **`src/components/expense/TopBar.tsx` (Lines 50–55 and 62–67)**:

  ```tsx
  <button
    className="grid place-items-center w-8 h-8 rounded-full active:scale-[0.94] transition-transform"
    style={{ color: "var(--text-secondary)" }}
  >
    <ChevronLeft size={18} />
  </button>
  ```

  and

  ```tsx
  <button
    className="grid place-items-center w-8 h-8 rounded-full active:scale-[0.94] transition-transform"
    style={{ color: "var(--text-secondary)" }}
  >
    <ChevronRight size={18} />
  </button>
  ```

  Neither chevron-only button has an `aria-label` or accessible name.

- **`src/components/expense/TopBar.tsx` (Lines 30–42)**:

  ```tsx
  <button
    onClick={onBell ?? openConverter}
    className="grid place-items-center rounded-full active:scale-[0.94] transition-transform"
    style={{...}}
    aria-label="Notifications"
  >
    <Bell size={16} style={{ color: "var(--text-secondary)" }} />
  </button>
  ```

  On the main dashboard page (`src/routes/index.tsx`, line 85), `<TopBar />` is rendered without passing `onBell`, which triggers the fallback to `openConverter`. Although clicking this button opens the **Currency Converter** dialog, the button's `aria-label` remains hardcoded to `"Notifications"`.

- **`src/components/expense/QuickAddSheet.tsx` (Line 149)**:

  ```tsx
  <button
    key={k}
    onClick={() => press(k)}
    className="h-12 rounded-2xl active:scale-[0.95] transition-transform grid place-items-center text-xl font-medium"
    style={{...}}
  >
    {k === "⌫" ? <Delete size={20} /> : k}
  </button>
  ```

  The keypad backspace button renders a `Delete` icon instead of a text value but contains no `aria-label`.

- **`src/components/expense/CurrencyConverterSheet.tsx` (Line 77)**:

  ```tsx
  <button
    onClick={swap}
    className="grid place-items-center rounded-full active:scale-[0.94] transition-transform"
    style={{...}}
  >
    <ArrowDownUp size={18} ... />
  </button>
  ```

  This swap button is icon-only and lacks an `aria-label`.

- **`src/routes/settings.tsx` (Lines 129–144)**:

  ```tsx
  <button
    key={c}
    onClick={() => setAccentColor(c)}
    className="grid place-items-center rounded-full active:scale-[0.94] transition-transform"
    style={{...}}
  >
    {accentColor === c && <Check size={14} color="#fff" />}
  </button>
  ```

  The accent color picker buttons are color-only circles (or checkmark-only when selected) and contain no accessible names or labels.

- **`src/routes/settings.tsx` (Lines 271–284)**:
  ```tsx
  <button
    type="button"
    disabled={disabled}
    onClick={onChange}
    className="relative rounded-full transition-colors"
    style={{...}}
    aria-pressed={on}
  >
  ```
  The custom `Toggle` component lacks an `aria-label` or `aria-labelledby` referencing the list row name.

---

### B. Complete Absence of Custom Focus Indicators

Across the codebase, custom styled buttons, links, inputs, and selects systematically suppress default browser focus outlines without providing replacements:

- **Inputs & Selects**:
  - `src/components/expense/CurrencyConverterSheet.tsx` (Line 166: `className="bg-transparent outline-none w-full font-mono font-medium"`, Line 188: `className="px-3 py-2 rounded-xl text-sm font-medium outline-none"`)
  - `src/components/expense/QuickAddSheet.tsx` (Line 175: `className="bg-transparent outline-none text-sm w-full"`)
  - `src/routes/transactions.tsx` (Line 107: `className="bg-transparent outline-none w-full text-sm"`)
- **Buttons & Links**:
  - `BottomTabBar.tsx` (Line 46), `FAB.tsx` (Line 5), `TopBar.tsx` (Lines 30, 50, 62), `QuickAddSheet.tsx` (Lines 64, 100, 138, 155, 183, 226), `CurrencyConverterSheet.tsx` (Lines 52, 77, 114), `settings.tsx` (Lines 129, 271), `analytics.tsx` (Line 159), `budget.tsx` (Line 172), and `index.tsx` (Line 217). None of these elements include custom focus styles (like `focus-visible:ring-2` or similar).

---

### C. Missing `tabular-nums` Styling on Sans-Serif Numbers

- **`src/routes/index.tsx` (Line 195)**:
  ```tsx
  <span>{Math.round(budgetUsed * 100)}% used</span>
  ```
  Renders numbers in standard sans-serif font without tabular numeral properties, which causes horizontal layout shifts as numbers update.
- **`src/components/expense/TransactionItem.tsx` (Line 37)**:
  ```tsx
  <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
    {tx.time}
  </div>
  ```
  Renders the time in standard sans-serif numerals, preventing vertical alignment across transaction item lists.
- **`src/routes/transactions.tsx` (Line 145)**:
  ```tsx
  <div className="grid place-items-center rounded-full text-[14px] font-semibold" ...>
    {d.d}
  </div>
  ```
  Renders calendar strip numbers in standard sans-serif, leading to inconsistent column widths based on digit shapes.
- **`src/components/expense/CurrencyConverterSheet.tsx` (Line 109)**:
  ```tsx
  <div className="text-[12px] text-center pt-1" ...>
    1 {from} = {rate} {to} · Updated 2h ago
  </div>
  ```
  Renders conversion values without tabular properties.

---

### D. Multi-Period Ellipsis Used for Loading States and Placeholders

We observed the following placeholder inputs utilizing three periods:

- **`src/components/expense/QuickAddSheet.tsx` (Line 176)**:
  ```tsx
  placeholder = "Add note...";
  ```
- **`src/routes/transactions.tsx` (Line 106)**:
  ```tsx
  placeholder = "Search transactions...";
  ```

---

## 2. Logic Chain

1. **Aria Labels**: Screen readers cannot announce elements without an accessible name. Since the ChevronLeft/ChevronRight icons, backspace key (`⌫`), swap icon, and color pickers have no descriptive text or labels, they must receive explicit `aria-label` tags to comply with WCAG 4.1.2.
2. **Contextual Confusions**: When a button's action changes based on page context (such as the TopBar Bell button opening a Currency Converter on the dashboard), retaining a hardcoded `aria-label="Notifications"` violates name/role alignment. Decoupling the triggers or updating the label dynamically is required.
3. **Keyboard Access**: Sighted keyboard users rely on focus indicators to see which element is active. Because the application styles remove standard browser outlines (`outline-none`) and fail to provide a custom alternative, the interactive controls are inaccessible to keyboard-only users. Applying a uniform focus ring style like `focus-visible:ring-2` to all triggers resolves this.
4. **Layout Shifts**: Sighted users experience layout jumps when numbers update dynamically (like the budget percentage or calendar columns). Applying the `tabular-nums` CSS property ensures all numerals share equal width, preventing layout shifts.
5. **Standardized Typographic Ellipses**: The horizontal ellipsis character `…` is designed as a single glyph and is parsed and read more reliably by screen readers compared to three consecutive periods `...`. Upgrading loading texts and placeholders to this standard improves both visual aesthetics and screen-reader parsing.

---

## 3. Caveats

- This investigation was strictly read-only; no code modifications were made to target source files.
- While the upcoming redesign relocates elements (e.g., migrating sheets to Radix-based dialogs and removing the bottom tab bar), the accessibility violations will persist in the new layout unless the specific recommendations outlined in the analysis are incorporated.

---

## 4. Conclusion

The current shell, navigation, and dashboard components contain multiple accessibility and design violations under the Vercel Web Interface Guidelines. For the upcoming redesign, we recommend:

1. Adding specific `aria-label` values to all icon-only chevrons, keypad backspaces, drag handles, color pickers, and custom toggle components.
2. Implementing custom focus rings using `focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background` on every interactive button, input, select, and link.
3. Applying Tailwind's `tabular-nums` utility to all sans-serif numeric outputs (percentages, times, list dates, rate labels).
4. Replacing all triple-dot placeholders and loading strings with the correct typographical ellipsis (`…`).

---

## 5. Verification Method

To verify these issues and ensure they are fixed post-implementation:

1. **Keyboard-Only Test**: Navigate the redesigned layout using `Tab` and `Shift+Tab`. Verify that every focusable control (sidebar links, selector chevrons, keypad items, dialog overlays) receives a distinct violet outline.
2. **Screen Reader Inspection**: Use a screen reader (e.g., NVDA, VoiceOver) or inspect the DOM tree to verify that icon-only buttons (like calendar chevrons, backspace key, color indicators) announce correct, descriptive labels.
3. **Layout Alignment Audit**: Change months and modify values; verify that no adjacent text blocks shift or jitter, indicating that `tabular-nums` is successfully applied.
4. **Workspace Build & Quality Checks**:
   - `npm run lint` — Verify no ESLint styling or accessibility issues.
   - `npm run build` — Verify static asset compilation succeeds.
