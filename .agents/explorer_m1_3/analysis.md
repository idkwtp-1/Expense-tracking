# Vercel UI & Accessibility Guidelines Audit Report

## 1. Icon-Only Buttons requiring Explicit `aria-label`

Icon-only buttons are interactive elements that have no visible text content. Screen readers rely entirely on an accessible name to announce these elements. The Vercel Web Interface Guidelines dictate that every button containing only an icon must have an explicit, descriptive `aria-label`.

### Violations in Current Codebase

We identified the following violations:

- **`src/components/expense/TopBar.tsx` (Month Selector buttons)**:
  - **Left chevron button (line 50)**:
    ```tsx
    <button className="grid place-items-center w-8 h-8 rounded-full active:scale-[0.94] transition-transform" ...>
      <ChevronLeft size={18} />
    </button>
    ```
    No `aria-label` is present. Screen readers will only announce "button" with no context.
  - **Right chevron button (line 62)**:
    ```tsx
    <button className="grid place-items-center w-8 h-8 rounded-full active:scale-[0.94] transition-transform" ...>
      <ChevronRight size={18} />
    </button>
    ```
    No `aria-label` is present.
- **`src/components/expense/TopBar.tsx` (Notifications Button / Currency Converter Trigger)**:
  - **Notification button (line 30)**:
    ```tsx
    <button onClick={onBell ?? openConverter} ... aria-label="Notifications">
      <Bell size={16} ... />
    </button>
    ```
    On the Dashboard (`src/routes/index.tsx`), this button is rendered without the `onBell` handler (line 85: `<TopBar />`). Therefore, it falls back to `openConverter`. Clicking this button opens the **Currency Converter** overlay.
    However, the button's `aria-label` is hardcoded to `"Notifications"`. This is highly misleading, violating WCAG 4.1.2 (Name, Role, Value).
- **`src/components/expense/QuickAddSheet.tsx` (Keypad Backspace Button)**:
  - **Backspace button (line 138-150)**:
    ```tsx
    <button key={k} onClick={() => press(k)} ...>
      {k === "⌫" ? <Delete size={20} /> : k}
    </button>
    ```
    When `k` is `"⌫"`, the button renders a `<Delete />` icon instead of text. There is no `aria-label` on this button, so screen reader users will not know its function.
- **`src/components/expense/CurrencyConverterSheet.tsx` (Drag handle and Swap buttons)**:
  - **Drag handle button (line 52)**:
    ```tsx
    <button onClick={onClose} className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full block" ... />
    ```
    This is an interactive drag handle that acts as a close button but contains no text and lacks an `aria-label`.
  - **Swap button (line 77-94)**:
    ```tsx
    <button onClick={swap} className="..." ...>
      <ArrowDownUp size={18} ... />
    </button>
    ```
    This button swaps "From" and "To" currencies. It renders the `ArrowDownUp` icon but has no `aria-label`.
- **`src/routes/settings.tsx` (Accent Color selection buttons)**:
  - **Color button (line 129-145)**:
    ```tsx
    <button key={c} onClick={() => setAccentColor(c)} ...>
      {accentColor === c && <Check size={14} ... />}
    </button>
    ```
    These buttons are styled only with dynamic background colors (`backgroundColor: c`). When selected, they display a Check icon. They contain no text or `aria-label`, leaving screen readers unable to read the colors.
  - **Toggle switch button (line 271-294)**:
    ```tsx
    <button type="button" disabled={disabled} onClick={onChange} ... aria-pressed={on}>
    ```
    The toggle component uses `aria-pressed={on}` but does not have an `aria-label` or `aria-labelledby` linking it to its label in the list row, making it anonymous to screen readers.

### Recommended Fixes for the Redesigned Shell & Dashboard

1. **Sidebar Navigation**: The redesigned sidebar will render links (Home, Transactions, Budget, Analytics, Settings) that contain both icons and text. However, if the desktop sidebar collapses into a narrow icon-only state, each sidebar link _must_ have an explicit `aria-label` describing the route (e.g. `aria-label="Navigate to Budget"`).
2. **Month Selector**:
   Add explicit, localized `aria-label` attributes to the buttons:
   ```tsx
   <button aria-label="Previous month" ...>
   <button aria-label="Next month" ...>
   ```
3. **Currency Converter Button (TopBar)**:
   In the redesigned layout, decouple the notifications bell and the currency converter trigger. If a button triggers the currency converter, it should use a currency icon (e.g., `DollarSign` or `Coins`) and have `aria-label="Open currency converter"`.
4. **Keypad Delete Button**:
   Add a conditional `aria-label` to the keypad button rendering:
   ```tsx
   <button
     key={k}
     onClick={() => press(k)}
     aria-label={k === "⌫" ? "Delete last digit" : undefined}
     ...
   >
     {k === "⌫" ? <Delete size={20} aria-hidden="true" /> : k}
   </button>
   ```
5. **Currency Swap Button**:
   Add an explicit `aria-label`:
   ```tsx
   <button onClick={swap} aria-label="Swap source and target currencies" ...>
     <ArrowDownUp size={18} aria-hidden="true" />
   </button>
   ```
6. **Sheet Drag Handle**:
   Since the drag handle is focusable and closes the sheet, it should have a label, or if it is redundant with clicking the backdrop and using ESC, it should be marked as decorative (`aria-hidden="true"` and `tabIndex={-1}`) or styled as a simple `div` instead of a `button` to avoid cluttering the keyboard tab order. If it is kept as a button:
   ```tsx
   <button onClick={onClose} aria-label="Close sheet" ... />
   ```
7. **Accent Color Buttons**:
   Pass a descriptive label identifying the color name:
   ```tsx
   const COLOR_NAMES: Record<string, string> = {
     "#7C3AED": "Purple",
     "#22C55E": "Green",
     "#EAB308": "Yellow",
     "#EF4444": "Red",
     "#3B82F6": "Blue",
     "#EC4899": "Pink",
   };
   // ...
   <button
     key={c}
     onClick={() => setAccentColor(c)}
     aria-label={`Select accent color: ${COLOR_NAMES[c] || c}`}
     aria-current={accentColor === c ? "true" : "false"}
     ...
   />
   ```
8. **Toggle Component**:
   Update the `Toggle` component signature to accept an optional `aria-label` or `aria-labelledby`, and apply it to the button:
   ```tsx
   function Toggle({
     on,
     onChange,
     disabled,
     label,
   }: {
     on: boolean;
     onChange: () => void;
     disabled?: boolean;
     label: string;
   }) {
     return (
       <button
         type="button"
         disabled={disabled}
         onClick={onChange}
         aria-pressed={on}
         aria-label={label}
         ...
       />
     );
   }
   ```

---

## 2. Focus Rings (`focus-visible:ring-2`) on All Interactive Controls

Interactive controls must have visible, high-contrast focus rings when focused via keyboard navigation to meet WCAG 2.4.7 (Focus Visible) and match Vercel design patterns.
Vercel designs typically style focus indicators using:

- `focus-visible:ring-2`
- `focus-visible:ring-ring` (mapped to violet/primary brand colors in this theme)
- `focus-visible:ring-offset-2`
- `focus-visible:outline-none`

### Violations in Current Codebase

Currently, **every custom interactive control** in the application uses Tailwind's `outline-none` or relies on default browser styles (which are overridden and hidden by `@layer base * { border-color: ... }` and custom layout resets).
The following specific interactive controls completely lack focus indicators:

- **`src/components/expense/BottomTabBar.tsx`**: `Link` tab items (line 46).
- **`src/components/expense/FAB.tsx`**: Floating action button (line 5).
- **`src/components/expense/TopBar.tsx`**: Notification/Converter button (line 30), Month selection buttons (lines 50, 62).
- **`src/components/expense/QuickAddSheet.tsx`**: Close button (line 64), Category buttons (line 100), Keypad buttons (line 138), Date switcher (line 155), Note input field (line 172), Save button (line 183), SegmentedToggle buttons (line 226).
- **`src/components/expense/CurrencyConverterSheet.tsx`**: Close button (line 52), Swap button (line 77), Currency switcher buttons (line 114), Amount input field (line 166), Currency select dropdowns (line 185).
- **`src/routes/transactions.tsx`**: Search input field (line 103), Calendar strip day buttons (line 122).
- **`src/routes/settings.tsx`**: Row navigation items (if they become buttons/links in future), Accent color selection buttons (line 129), Toggle buttons (line 271).
- **`src/routes/budget.tsx`**: "Add budget" button (line 172).
- **`src/routes/index.tsx`**: "See all →" link (line 217).

### Recommended Fixes for the Redesigned Shell & Dashboard

To implement consistent Vercel-style focus rings across all interactive controls:

1. **Define a Tailwind Focus Utility**:
   In `src/styles.css`, we can ensure that the `--color-ring` (which points to `var(--accent-violet)`) is correctly configured in Tailwind v4. Under `@theme inline`, we already have `--color-ring: var(--ring)`.
   We can define a standard focus utility in CSS or use inline classes.
   Standard Tailwind focus classes to apply:
   `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background`
2. **Apply to Buttons and Links**:
   Update standard components to include these classes. For example, for buttons:
   ```tsx
   className =
     "... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background";
   ```
3. **Apply to Input and Select Controls**:
   Inputs and Select components should receive focus rings on focus.
   For inputs like note/search input:
   ```tsx
   // Apply ring to the container element when the input is focused:
   className =
     "flex items-center gap-2 px-3 h-10 rounded-xl border border-border-subtle focus-within:ring-2 focus-within:ring-accent-violet focus-within:ring-offset-2 focus-within:ring-offset-background";
   ```
4. **Desktop Sidebar Links**:
   Apply focus rings on sidebar links in the redesigned `MobileShell` (dual-column desktop layout):
   ```tsx
   <Link
     to={to}
     className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
   >
   ```

---

## 3. Tabular Numerals (`font-variant-numeric: tabular-nums`) for Currency Lists and Tables

Tabular numerals (monospace numbers) align numbers vertically in columns, preventing horizontal layout shifting when numbers update or dynamically change.

### Violations in Current Codebase

- **`src/routes/index.tsx` (Dashboard Budget Health percentage)**:
  - Line 195: `<span>{Math.round(budgetUsed * 100)}% used</span>`
    Renders standard sans-serif numerals. As budget values load or change, the layout shifts.
  - Line 202-210 (Stat Pills):
    - `{currentMonthTxs.length} transactions`
    - `{overBudgetCount} over budget`
    - `{billsDueCount} bills due`
      These render standard sans-serif digits which can shift pill widths dynamically.
- **`src/components/expense/TransactionItem.tsx` (Time Display)**:
  - Line 37: `<div className="text-[12px] mt-0.5" ...>{tx.time}</div>`
    Renders the timestamp (e.g. "14:23") in sans-serif. In vertical lists of transactions, the times do not align vertically due to differing character widths of the digits.
- **`src/routes/transactions.tsx` (Calendar Strip day numbers)**:
  - Line 145: `{d.d}`
    Renders dates (e.g. 1 to 31) in sans-serif. This causes calendar columns to have slightly different spacings depending on the width of the active numbers (e.g., "11" is narrower than "28").
- **`src/components/expense/CurrencyConverterSheet.tsx` (Exchange Rate label)**:
  - Line 109: `1 {from} = {rate} {to}`
    Renders exchange rates (e.g. "0.7400") in sans-serif.
- **`src/routes/settings.tsx` (Storage Size and App Version)**:
  - Lines 113 & 157: These are currently using `font-mono` which is correct, but should ensure tabular-nums is inherited.

### Recommended Fixes for the Redesigned Shell & Dashboard

1. **Sans-Serif Tabular Numerals Utility**:
   We can define a utility class `.tabular-nums` in Tailwind (or use the built-in `tabular-nums` class) to apply `font-variant-numeric: tabular-nums` to sans-serif numeric elements, so they align beautifully without forcing a monospace font family:
   ```css
   .tabular-nums {
     font-variant-numeric: tabular-nums;
   }
   ```
2. **Apply to Dashboard Budget Health Percentage**:
   Update line 195 to:
   ```tsx
   <span className="tabular-nums">{Math.round(budgetUsed * 100)}% used</span>
   ```
3. **Apply to Stat Pills**:
   Update the `StatPill` component to enforce tabular numerals for its text content:
   ```tsx
   export function StatPill({ children }: { children: ReactNode }) {
     return (
       <div
         className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap tabular-nums"
         style={{ ... }}
       >
         {children}
       </div>
     );
   }
   ```
4. **Apply to Calendar Strip**:
   Update the calendar day numbers in `transactions.tsx` (line 145) to use tabular-nums:
   ```tsx
   <div className="grid place-items-center rounded-full text-[14px] font-semibold tabular-nums" ...>
     {d.d}
   </div>
   ```
5. **Apply to Transaction Time Display**:
   Update `TransactionItem` time display (line 33-39) to:
   ```tsx
   <div
     className="text-[12px] mt-0.5 tabular-nums"
     style={{ color: "var(--text-muted)" }}
   >
     {tx.time}
   </div>
   ```
6. **Apply to Currency Converter Exchange Rate**:
   Update the exchange rate text to use tabular numbers:
   ```tsx
   <div className="text-[12px] text-center pt-1 tabular-nums" ...>
     1 {from} = {rate} {to} · Updated 2h ago
   </div>
   ```

---

## 4. Ellipsis Characters (`…` instead of `...`) for Loading States

Vercel Web Interface Guidelines specify using the single horizontal ellipsis character (`…`, Unicode U+2026) rather than three consecutive periods (`...`) for loading states, placeholders, and truncated text. This improves rendering consistency and screen reader pronunciation.

### Violations in Current Codebase

While there are no active visual loading indicator states currently rendering `Loading...` in the codebase, we found several placeholder texts that violate this rule:

- **`src/components/expense/QuickAddSheet.tsx` (Add note input)**:
  - Line 176: `placeholder="Add note..."`
    Uses three periods.
- **`src/routes/transactions.tsx` (Search input)**:
  - Line 106: `placeholder="Search transactions..."`
    Uses three periods.

### Recommended Fixes for the Redesigned Shell & Dashboard

1. **Update Input Placeholders**:
   Modify the placeholder strings to use the horizontal ellipsis character:
   - Note placeholder: `placeholder="Add note…"`
   - Search placeholder: `placeholder="Search transactions…"`
2. **Define Loading States for Redesigned Components**:
   When implementing future data-fetching states, lazy loading fallback components, or skeleton loaders, ensure any textual feedback uses the proper ellipsis:
   ```tsx
   <div>Loading data…</div>
   ```
   Or:
   ```tsx
   <div>Saving transaction…</div>
   ```
