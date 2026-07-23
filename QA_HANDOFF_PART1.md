# QA Handoff: PART 1

## Environment Status
- **Status**: The application is built and running via `npm run preview`.
- **Access Method**: The web interface is accessible at `http://localhost:5173`. The application is also packaged to run as a desktop app via `run_pywebview.py`.
- **Data Layer**: Pure client-side `localStorage` via a React Context provider (`src/lib/store.tsx`). Memory state is synchronized to local storage.
- **External Dependencies**: Radix UI (previously, largely replaced with custom components), Tailwind CSS, TanStack Start, TanStack Router. Playwright for E2E testing. Pywebview for desktop wrapping.

## Core Category Applicability
1. **UI & Visual**: APPLY (Core to the user experience; rich interactions, animations, and custom UI components are present).
2. **Functionality & Designed Behavior**: APPLY (Crucial logic around managing money, wallets, and settings).
3. **Accessibility**: APPLY (App utilizes modals/sheets, custom inputs, keypads, and focus management).
4. **Backend & API**: N/A (App relies purely on local storage and local logic; no backend API is integrated).
5. **Data Validation**: APPLY (Amount inputs, custom currency definitions, notes, and wallet names need validation).
6. **Database & Persistence**: APPLY (`localStorage` persistence layer needs verifying for reliable state preservation).
7. **Security**: APPLY (XSS risks in input fields like notes and wallet names).
8. **Error Handling**: APPLY (Graceful handling of bad inputs, unparseable numbers, invalid conversions).
9. **Performance**: APPLY (Hydration performance, large transaction list rendering, custom keypad responsiveness).
10. **Business Logic & Application Correctness**: APPLY (Currency conversions, budget tracking, remaining wallet balances).
11. **Cross-Client Consistency**: N/A (Local-first, single-device app).
12. **Console & Log Audit**: APPLY (Need to check for silent hydration errors, SSR mismatches, and warnings).

## Module Applicability
- **Module A (External API)**: N/A (Uses static/custom rates, no external API fetching).
- **Module B (Media/Files)**: N/A (No file uploads/downloads).
- **Module C (Hardware)**: N/A (No hardware features used).
- **Module D (Local Persistence)**: APPLY (Verifying `localStorage` operations and edge cases).
- **Module E (Computed Values)**: APPLY (Critical testing for exchange rates, budget remaining, net savings, cross-currency totals).
- **Module F (Filtering & Search)**: APPLY (If applicable in Transactions view).
- **Module G (Video/Audio)**: N/A (No media playback).
- **Module H (Cloud Sync)**: N/A (Local only).
- **Module I (Local Network)**: N/A (Not designed for cross-device network transfer).

---

## Test Plan

### Phase 1: Core Categories (1-6) + Modules (A-E)

**1. Quick Add Sheet (Expense/Income)**
- [ ] UI visual states: expense (red/dark) vs income (green).
- [ ] Mode toggle changes input state correctly.
- [ ] Number pad input correctness (multiple decimals, max length, backspace behavior).
- [ ] Category selection scroll & active states.
- [ ] Date input defaults and modification.
- [ ] Note text input limits and sanitization.
- [ ] Save functionality logs correctly to the store.

**2. Currency Converter Sheet**
- [ ] Layout & visual states.
- [ ] 'From' and 'To' currency selection (including custom currencies).
- [ ] Number pad input correctness.
- [ ] Custom rate input (override default rate).
- [ ] Swap button logic and animation.
- [ ] Computed conversion accuracy (Module E).

**3. Travel Wallets - Creation & Management**
- [ ] New Wallet Sheet UI and mounting behavior.
- [ ] Source currency vs Target currency logic.
- [ ] Computed exchange rate auto-calculation between Base Cost and Foreign Amount.
- [ ] Empty/Invalid state validation (no name, zero amounts).
- [ ] Ensure wallet appears in Active Wallets list.
- [ ] Wallet progression bar accuracy based on remaining amount.

**4. Travel Wallets - Operations (Top Up & Log Spend)**
- [ ] Top Up Sheet: Base Cost to Foreign Amount calculation.
- [ ] Log Spend Sheet: Deducts from wallet correctly.
- [ ] Category assignment inside wallet spends.
- [ ] Overdrawn wallet visual states (turns red).
- [ ] Computed values: Check remaining balance formulas (Module E).

**5. Travel Wallets - Lifecycle**
- [ ] Archive wallet functionality (moves to archived list).
- [ ] Unarchive / Delete functionality (if present).
- [ ] Archived wallet visual states (opacity 60%, unclickable or read-only).

**6. Budgets & Transactions**
- [ ] Budget calculation logic (net savings, category limits) (Module E).
- [ ] Transaction list rendering.
- [ ] Deleting a transaction updates net budget correctly.

**7. Settings & Persistence**
- [ ] Privacy Mode toggle hides balances everywhere.
- [ ] Accent color changing updates CSS variables globally.
- [ ] Custom Exchange Rates: Add new, edit, delete.
- [ ] Local Storage Persistence (Module D): Refresh page and ensure all data remains intact.

### Phase 2: Core Categories (7-12) + Modules (F-I)

**8. Security & Input Validation**
- [ ] XSS injection tests on Wallet Name, Spend Note, Transaction Note.
- [ ] Extreme boundary values on numeric inputs.

**9. Error Handling & Edge Cases**
- [ ] Attempting to parse `NaN` or `Infinity` inputs.
- [ ] Storage quota limits (if possible to simulate).
- [ ] Interrupted operations.

**10. Performance & Console Audit**
- [ ] Audit browser console for React hydration errors or unhandled exceptions.
- [ ] Audit memory usage when opening/closing sheets repeatedly.
- [ ] Keypad responsiveness (no lag on rapid clicks).

**11. Business Logic & Completeness**
- [ ] Verify there are no duplicate/conflicting IDs generated in transactions.
- [ ] Ensure `useExpense` context updates trigger accurate re-renders without stale state.
- [ ] Verify that UI constraints (like no income category in Log Spend) are enforced structurally.

---
## Blockers / Notes for Next Session
- **Note**: The Radix UI `Dialog` components were completely removed and replaced with a custom client-only `Sheet.tsx` component to resolve SSR hydration bugs where button clicks failed. Make sure to test the custom Sheet implementation thoroughly (escape key, overlay click, scroll lock, z-index).
- **Environment**: Use `http://localhost:5173` to test the preview server.
