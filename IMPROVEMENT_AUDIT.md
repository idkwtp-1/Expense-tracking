# Improvement Audit: SLPlayer Wallet

**Platform:** Hybrid (VBS/Python Desktop wrapper + Vercel PWA)
**Audience:** Solo-use

This audit evaluates the application based on its specific use case as a personal, single-user hybrid app. Because it's a solo app, I've deprioritized enterprise-level security paranoia and accessibility perfection in favor of maintainability, performance, and daily usability.

---

## 1. Quick wins (High impact, low effort)

*   **Move to dynamic (or editable) exchange rates:** In `src/lib/types.ts`, `RATES` is completely hardcoded (e.g., `USD: 0.74`). Since currency fluctuates, these hardcoded conversions will skew your data over time. *Recommendation:* Add an exchange rate override in the Settings page, or fetch daily rates from a free API on app startup.
*   **Fix build-time vulnerabilities:** A run of `npm audit` reveals 5 high-severity vulnerabilities in your build dependencies (PostCSS, browserslist, nanoid). Fixing them prevents future build breaks. *Recommendation:* Run `npm audit fix`.
*   **Move heavy inline styles to CSS/Tailwind:** `MobileShell.tsx` contains massive inline style objects (e.g., `backdropFilter: "blur(40px)"`). This is a classic AI generation artifact. *Recommendation:* Move these into `@utility` blocks in `styles.css` and apply them as class names.

## 2. Bigger investments (High impact, moderate effort)

*   **Optimize Desktop Launch (Bypass Node.js):**
    Right now, `run_pywebview.py` boots Node.js to run `npm run preview` to serve your static files. Node takes time to start, making cold launches slower.
    *Recommendation:* PyWebView natively supports serving a local directory without needing a Node server. You can point PyWebView directly to the `dist` folder. This will make the desktop app open almost instantaneously and drastically reduce background RAM usage.
*   **Optimize the "visionOS" Background Performance:**
    In `MobileShell.tsx`, there are 3 giant animated orbs with massive CSS blurs (`filter: blur(70px)`). Continuously animating elements with huge blur radiuses is notoriously heavy on GPU rendering. You may notice your laptop fan spinning up or mobile battery draining if the app is left open.
    *Recommendation:* If you love the aesthetic, bake the blurred orbs into a static background image, or reduce the `blur()` values and animate their opacity instead of their positions to save GPU cycles.

---

## 3. Findings by Section

### 1. Launch & startup
*   **Smart window reveal:** The desktop wrapper uses `hidden=True` and waits for `window.events.loaded` before showing the GUI. This is a genuinely excellent UX choice that prevents the dreaded "white flash" on boot.
*   **Service Worker Scorch Earth:** In `main.tsx`, there's a dev-mode check that actively unregisters service workers. This is a very smart defensive coding pattern to prevent PWA caching nightmares while developing. 

### 2. Runtime performance & responsiveness
*   **GPU drain on animations:** As noted above, the animated mesh gradient in `MobileShell.tsx` is expensive. For a utility app like an expense tracker, you generally want zero idle CPU/GPU usage. 
*   **Bundle size:** The Vercel deployment logs show `index.js` is ~584kB (167kB gzipped). For a React app using TanStack router and Recharts, this is totally fine, especially since the PWA caches it locally.

### 3. Idle & background behavior
*   **Offline Queue (`syncQueue.ts`):** The app gracefully handles being offline by queuing changes to `localStorage` and pushing them to Supabase when the `online` event fires. This is a robust approach perfectly suited for a PWA that might be used in low-signal areas.

### 4. Shutdown & state handling
*   **Violent Desktop Shutdown:** `run_pywebview.py` uses `taskkill /F /T /PID` to terminate the Vite preview server when closed. It works, but it's completely unnecessary if you transition to serving the `dist` folder natively via Python.

### 5. UI / visual design
*   **AI Visual Signatures:** The application heavily relies on "Glassmorphism" (translucency, heavy blurs, white borders with low opacity). This is a very common "AI default" when asked to make something look "premium" or "Apple-like". 
*   **Contrast Issues:** Because text is largely rendered over semi-transparent backgrounds, readability in bright environments (like using the PWA on your phone outside) might suffer. 

### 6. UX & interaction design
*   **Manual Export/Import:** The settings page handles JSON/CSV exports cleanly via `Blob` downloads. Since this is a solo-use app, this is a perfect, low-friction way to ensure you never lose your data without needing to build complex cloud backup interfaces.

### 9. Code quality & maintainability
*   **Style fragmentation:** The codebase has a split personality. It uses Shadcn UI and standard Tailwind utility classes, but then layers massive inline styles on top of them. *Confirm with me first:* Should we standardize the codebase to strictly use Tailwind/CSS for styling to clean up the components?
*   **Tight coupling:** `settings.tsx` contains raw CSV generation logic directly inside the UI component. This makes the file 550+ lines long. Moving that logic to `utils.ts` would make the UI much easier to read.
