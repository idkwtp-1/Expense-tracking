## 2026-07-07T22:51:08Z

You are the Implementation Worker (Worker 1). Your working directory is d:\Personal Projects\Expense trackinig\.agents\worker_impl_1.

Your objective is to implement the requirements for Part 1 (Layout & Sidebar Navigation, Bento Box Grid Dashboard) and Part 2 (Centered Dialog Migration).

Here are the detailed specifications:

### 1. Shell & Navigation Upgrade

- Modify `src/components/expense/MobileShell.tsx` to remove the strict mobile constraints and implement a desktop-friendly layout:
  - Create a dual-column container:
    - **Left Column**: Sidebar navigation (docked on the left for viewports >= 1024px).
    - **Right Column**: Scrollable main content area (renders `<Outlet />`).
  - Delete or disable the bottom tab-bar menu (`BottomTabBar.tsx` / bottom nav layout) completely.
  - Create a modern desktop Sidebar navigation component containing:
    - Clear navigation links for all routes: Home (`/`), Transactions (`/transactions`), Budget (`/budget`), Analytics (`/analytics`), and Settings (`/settings`).
    - Clear active navigation visual states (e.g. background highlight, accent color border) and smooth transition hover effects on the items.
    - Focus visible indicators (`focus-visible:ring-2 focus-visible:ring-accent-violet`) on all navigation links and buttons.
    - Buttons to trigger "Quick Add" and "Currency Converter" (since the bottom FAB and tab bar are removed).
  - Ensure any icon-only elements or buttons have explicit `aria-label` tags.

### 2. Bento Box Grid Dashboard Layout

- Redesign `src/routes/index.tsx` to use CSS Grid for its dashboard widgets:
  - Widgets to organize:
    - _Net Balance Hero_
    - _Safe to Spend Card_
    - _Budget Health & Stat Pills_ (or a combined "Budget Overview" bento box)
    - _Quick Actions_ (buttons to open Quick Add and Currency Converter)
    - _Recent Transactions_
    - _Bills List_
  - Arrange them inside a responsive CSS Grid container (e.g., `grid grid-cols-1 lg:grid-cols-3 gap-6`). Make sure it is symmetric and looks premium.
  - Style cards using a dark glassmorphic design: `backdrop-filter: blur(12px)`, translucent card background (e.g., `rgba(255, 255, 255, 0.03)` or `var(--surface-raised)` with transparency), subtle borders (`var(--border-subtle)`), and deep violet accents.
  - Ensure no layout elements are cropped or clipped on resolutions 1024px and wider.
  - Apply `font-variant-numeric: tabular-nums` or the `.font-mono` / custom tabular class for all numeric metrics, lists, dates, and currency values.

### 3. Dialog Migration (Part 2)

- Migrate `src/components/expense/QuickAddSheet.tsx` and `src/components/expense/CurrencyConverterSheet.tsx` from bottom-sheets to centered desktop Dialog modals.
- Utilize `@radix-ui/react-dialog` to build these dialogs. Ensure:
  - Modals open centered on the screen.
  - Pressing the Escape key closes the modals.
  - Background interaction is blocked while the modals are open.
  - Proper focus trapping is active (automatically handled by Radix Dialog).
  - Clean glassmorphism styling is applied on the dialog content surface.
  - Input fields, keypads, select dropdowns, and buttons are responsive and styled with custom focus rings (`focus-visible:ring-2`).

### 4. Accessibility & UI Guidelines Compliance

- Ensure 100% compliance with Vercel Web Interface Guidelines:
  - Add explicit `aria-label` to all icon-only buttons (including chevrons in `TopBar.tsx`, backspace in the keypad, and swap button in currency converter).
  - Add custom visible focus indicators (`focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background`) on all buttons, links, inputs, and selects.
  - Replace all triple-dot placeholders (`...`) with the exact typographic ellipsis character (`…`).

### 5. Cleanup

- Clean up unused imports, comments, or components (like `BottomTabBar.tsx` and `FAB.tsx` if they are fully replaced).

### 6. Build & Test Verification

- Run `npm run lint` to check for linter violations.
- Run `npm run build` to verify the static build compiles successfully.
- Run `npm run test:e2e` to verify all routing, dashboard, and dialog features work.
- Include all command outputs, build success state, and verification steps in your handoff report (`handoff.md`).

MANDATORY INTEGRITY WARNING — include this verbatim in your implementation:

> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.
