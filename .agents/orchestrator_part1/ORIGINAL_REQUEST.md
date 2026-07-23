# Original User Request

## Follow-up — 2026-07-07T22:31:18Z

Execute Part 1 of the UI Redesign: Core Navigation & Layout Rewrite (Desktop Sidebar & Bento Grid).

Working directory: d:\Personal Projects\Expense trackinig
Integrity mode: development

## Requirements

### R1. Desktop Layout & Shell Upgrade

- Modify or replace the main shell layout component (currently `MobileShell.tsx` wrapping the application in `__root.tsx`) to remove the strict `maxWidth: 430` mobile constraints.
- Replace the mobile shell with a widescreen desktop grid container.
- Remove the bottom tab-bar menu (`BottomTabBar.tsx` / bottom nav layout).

### R2. Implement Desktop Sidebar Navigation

- Create a modern, collapsible or static desktop Sidebar Navigation.
- Include links for all application routes: Home (`/`), Transactions (`/transactions`), Budget (`/budget`), Analytics (`/analytics`), and Settings (`/settings`).
- Style active nav states clearly and add smooth transition hover effects on the items.

### R3. Bento Box Grid Dashboard Layout

- Redesign the main Dashboard page (`/`) to utilize a CSS Grid "Bento Box" widget layout.
- Organize the "Safe to Spend" card, quick actions, budget overview, recent transactions, and bills list as distinct bento boxes inside the grid.
- Ensure the layout is responsive and looks clean on desktop resolutions (1024px to 1920px).

## Acceptance Criteria

- [ ] Bottom navigation menu is completely removed.
- [ ] A navigation sidebar is visible on the left side of the screen.
- [ ] Clicking sidebar items changes routes successfully.
- [ ] The dashboard cards are organized inside a CSS Grid (Bento Box style) layout.
- [ ] No layout elements are cropped or clipped on resolutions 1024px and wider.

## Follow-up — 2026-07-07T22:39:22Z

Execute Part 2 of the UI Redesign: Desktop Overlays & Modals (Dialog Migration).

Working directory: d:\Personal Projects\Expense trackinig
Integrity mode: development

## Requirements

### R1. Quick Add Dialog Migration

- Convert `QuickAddSheet.tsx` from a bottom-sheet sliding layout to a centered, responsive desktop overlay Dialog (modal).
- Ensure it uses clean glassmorphism background styles matching the new design system.
- Include proper focus trapping inside the modal using standard dialog behaviors.

### R2. Currency Converter Dialog Migration

- Convert `CurrencyConverterSheet.tsx` from a bottom-sheet sliding layout to a matching centered desktop overlay Dialog.
- Implement proper layout spacing for the input fields and select dropdowns so it looks clean on a desktop screen.

## Acceptance Criteria

- [ ] Both Quick Add and Currency Converter open as centered modals instead of sliding bottom-sheets.
- [ ] Pressing the Escape key closes the modals.
- [ ] Background interaction is blocked while the modals are open.
