# QA Handoff Part 1 — Reconnaissance & Master Test Plan

## Environment Status & Access Method
- **Local Dev Server**: Vite dev server (`http://localhost:5173`)
- **Build Verification**: `npm run build` succeeds clean with zero errors (Vite SPA output in `dist/`)
- **Live Production URL**: `https://expense-tracking-vert-alpha.vercel.app/`
- **E2E Test Suite**: Playwright (`npm run test:e2e`) passing 63 tests

---

## Data Layer & Infrastructure Notes
- **Local Storage Layer**: `localStorage` keys (`slplayer-transactions`, `slplayer-wallets`, `slplayer-wallet-spends`, `slplayer-budgets`, `slplayer-custom-rates`, `slplayer-privacy`, `slplayer-accent`) for 0-latency offline PWA support.
- **Cloud Storage & Sync Layer**: Supabase PostgreSQL tables (`transactions`, `wallets`, `wallet_spends`, `budget_limits`) using `@supabase/supabase-js`.
- **Realtime Channel**: Supabase WebSockets (`db-realtime-sync`) for instant cross-device synchronization between mobile PWA and desktop.
- **PWA Service Worker**: `/sw.js` cache-first offline service worker with manifest `/manifest.json`.

---

## Core Category Applicability

1. **UI & Visual**: **APPLY** — Full web UI, responsive layouts (320px–1440px), glassmorphism styles, dark theme, interactive cards, charts, and drawer modals.
2. **Functionality & Designed Behavior**: **APPLY** — Full inventory pass across all interactive elements, forms, transaction entry, converter, and settings.
3. **Accessibility**: **APPLY** — Focus ring navigation, focus traps in modals, aria-labels, high-contrast text, escape key dismissal.
4. **Backend & API**: **APPLY** — Supabase REST API & Realtime WebSockets endpoints.
5. **Data Validation**: **APPLY** — Numeric inputs, decimal points, currency codes, non-zero amounts, XSS & regex input sanitization.
6. **Database & Persistence**: **APPLY** — Dual persistence verification (`localStorage` + Supabase PostgreSQL tables).
7. **Security**: **APPLY** — XSS injection in notes/search, regex injection, RLS security policies, no leaked secrets.
8. **Error Handling**: **APPLY** — Custom 404 boundary, error boundary fallback, network disconnect gracefully handled.
9. **Performance**: **APPLY** — Rapid tab switching, donut chart re-renders, 100+ transaction list rendering.
10. **Business Logic & Application Correctness**: **APPLY** — Financial math (net balance, safe-to-spend, wallet conversions, budget progress).
11. **Cross-Client Consistency**: **APPLY** — Realtime phone <-> desktop state equality.
12. **Console & Log Audit**: **APPLY** — Zero runtime console errors, zero React hydration warnings.

---

## Specialized Modules Applicability

- **Module A: External API & Third-Party Services**: **APPLY** — Supabase API calls & failure graceful handling.
- **Module B: Media, File Handling & Downloads**: **APPLY** — Data export (JSON file download) & Data import (JSON file upload).
- **Module C: Real-Time, Hardware & Device Features**: **N/A** — No hardware camera/mic sensors used.
- **Module D: Local Persistence & Offline Behavior**: **APPLY** — Offline PWA behavior, hydration checks, storage persistence.
- **Module E: Computed Values, Formulas & Gamification**: **APPLY** — Currency exchange formulas, budget calculations, safe-to-spend algorithm.
- **Module F: Filtering, Search & Sort Systems**: **APPLY** — Transaction search, category filters, date filters, top merchant sorting.
- **Module G: Video & Audio Playback**: **N/A** — No audio/video players.
- **Module H: Cloud Sync & Multi-Device**: **APPLY** — Supabase Realtime multi-device sync.
- **Module I: Local Network & Cross-Device Transfer**: **N/A** — No P2P socket server.

---

## Master Numbered Test Plan

### Part 2 Batches (Categories 1–6 + Modules A–E)

#### Category 1 — UI & Visual
1. **[T01]** Viewport responsiveness test at 320px, 768px, 1024px, and 1440px on all routes (`/`, `/transactions`, `/budget`, `/wallets`, `/analytics`, `/settings`).
2. **[T02]** Element state audit: verify hover, focus, active, disabled, loading, and empty states on all buttons and cards.
3. **[T03]** Extreme text & copy rendering: verify long merchant names, special characters (`<script>`, emojis, RTL text) do not overflow UI containers.
4. **[T04]** Empty states verification: brand new zero-data state displays clear CTA without broken text or NaN values.

#### Category 2 — Functionality & Element-by-Element Inventory
5. **[T05]** TopBar actions: verify privacy mode toggle masks money with `••••`, accent color picker updates theme, and Quick Add button opens drawer.
6. **[T06]** Quick Add Drawer — Income vs Expense mode: verify switching to Income hides expense category selector and auto-selects Income category.
7. **[T07]** Quick Add Drawer — Keypad & Keyboard input: test digits 0-9, decimal point `.`, double decimal prevention, backspace `⌫`, and physical keyboard typing.
8. **[T08]** Quick Add Drawer — Currency selector: verify CAD, USD, EUR, KGS, CNY, TRY, GBP, JPY and custom currencies are selectable.
9. **[T09]** Quick Add Drawer — Save & Auto-Wallet Creation: verify adding income in foreign currency auto-creates or links to an active foreign wallet.
10. **[T10]** Quick Add Drawer — Exit paths: verify backdrop click, close button, and Escape key close the drawer cleanly.
11. **[T11]** Wallet Converter — Empty state: opening converter with no funded wallets shows clear guidance to add income/funds first.
12. **[T12]** Wallet Converter — Conversion execution: select source active wallet, target currency, custom exchange rate, and execute conversion; verify atomic balance update.
13. **[T13]** Wallet Converter — Top Up mode: opening with `defaultTo` prop pre-selects the target wallet correctly.
14. **[T14]** Wallets Index (`/wallets`): verify active wallets list, total funded, remaining balance, and status pills.
15. **[T15]** New Wallet Drawer (`NewWalletSheet`): create wallet with currency, foreign amount, base cost, and verify funding transaction creation.
16. **[T16]** Wallet Details (`/wallets/$walletId`): test Archive/Unarchive toggle, Delete wallet modal, Log Spend drawer, and spend entry list.
17. **[T17]** Log Spend Drawer (`LogSpendSheet`): log spend with foreign amount, note, category tag, and date; verify remaining balance deduction.
18. **[T18]** Edit & Delete Spend: edit existing spend entry and delete spend entry; verify wallet remaining balance is restored.
19. **[T19]** Transactions Page (`/transactions`): verify grouped list by day, date navigation, and delete transaction button.
20. **[T20]** Budget Page (`/budget`): verify monthly budget limit summary, category limit edit triggers, and financial tabular layout.
21. **[T21]** Settings Page (`/settings`): test accent color selection, custom currency addition/deletion, export data JSON, import data JSON, and clear all data.

#### Category 3 — Accessibility
22. **[T22]** Keyboard Tab Navigation: verify logical focus order across sidebar, header, cards, and buttons.
23. **[T23]** Modal Focus Trap: verify focus is trapped inside Quick Add, Wallet Converter, and New Wallet drawers when open.
24. **[T24]** Keyboard Dismiss: verify Escape key dismisses all open modals, drawers, and overlays.
25. **[T25]** Color contrast & zoom: verify text readability at 200% browser zoom.

#### Category 4 — Backend & API
26. **[T26]** Supabase REST API requests: verify status 200 OK for `transactions`, `wallets`, `wallet_spends`, and `budget_limits` queries.
27. **[T27]** Invalid payload handling: test API resilience against null or malformed fields.

#### Category 5 — Data Validation
28. **[T28]** Non-zero amount enforcement: verify zero amount or negative invalid input cannot be saved in Quick Add or Converter.
29. **[T29]** Double decimal point rejection on keypad and text inputs.
30. **[T30]** Currency code validation: custom currency codes sanitized to uppercase alphanumeric string.

#### Category 6 — Database & Persistence
31. **[T31]** Dual Persistence Write: verify actions write to both `localStorage` and Supabase PostgreSQL.
32. **[T32]** App Restart & Refresh preservation: hard refresh browser and verify state remains identical.
33. **[T33]** Orphaned record cleanup: deleting a wallet or transaction removes associated database rows cleanly.

#### Module A — External API & Third-Party Services
34. **[T34]** Supabase Network Disconnect: block network requests and verify app falls back gracefully to `localStorage` without crashing.

#### Module B — Media, File Handling & Downloads
35. **[T35]** Data Export: click Export Data in Settings → verify JSON backup file downloads cleanly.
36. **[T36]** Data Import: upload valid JSON backup file → verify all transactions, wallets, and budgets restore accurately.
37. **[T37]** Corrupted File Import: upload invalid JSON file → verify error message is surfaced without app crash.

#### Module D — Local Persistence & Offline Behavior
38. **[T38]** PWA Offline Mode: go offline in browser DevTools → verify app loads from Service Worker cache and functions offline.
39. **[T39]** Offline Reconnect Sync: make changes offline, reconnect network → verify local changes sync to Supabase.

#### Module E — Computed Values & Financial Formulas
40. **[T40]** Net Balance Calculation: verify sum of all CAD transactions matches Net Balance widget.
41. **[T41]** Safe-to-Spend Formula: verify daily & monthly safe-to-spend calculation based on income minus budget limits.
42. **[T42]** Wallet Remaining Balance Formula: verify `total_foreign_funded - sum(spends)` equals remaining balance.
43. **[T43]** Currency Exchange Math: verify `amount * rate` conversion output across CAD, USD, EUR, and JPY.

---

### Part 3 Batches (Categories 7–12 + Modules F–I)

#### Category 7 — Security
44. **[T44]** XSS Injection Test: input `<script>alert(1)</script>` into Quick Add note, merchant name, and wallet note → verify safe text rendering.
45. **[T46]** Regex Injection Test: enter `.*` and `[a-z]+` into transaction search field → verify no crash or regex exception.
46. **[T46]** Supabase RLS Policy Audit: verify public policies permit valid client operations without exposing backend credentials.

#### Category 8 — Error Handling
47. **[T47]** Custom 404 Route Test: navigate to non-existent route (`/random-path`) → verify custom 404 Error Boundary renders cleanly.

#### Category 9 — Performance
48. **[T48]** Analytics Rapid Tab Switch: click rapidly between "This Month", "Last Month", and "All Time" → verify no chart glitch or memory leak.
49. **[T49]** Large Transaction Dataset: load 100+ transactions → verify list scroll performance stays smooth.

#### Category 10 — Business Logic & Application Correctness
50. **[T50]** Cross-Client Realtime Sync (Module H): add transaction on Phone PWA / client A → verify Desktop / client B receives Realtime WebSocket update and updates UI dynamically.
