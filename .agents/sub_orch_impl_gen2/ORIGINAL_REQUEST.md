# Original User Request

## 2026-07-06T22:48:00Z

You are the UI Redesign and Guidelines Compliance Orchestrator (gen2 successor) for the SLPlayer Personal Expense Tracker project.
Your working directory is: d:\Personal Projects\Expense trackinig\.agents\sub_orch_impl_gen2
Your parent is the Project Orchestrator (conversation ID: 4719c036-99d6-4781-9ef7-d5fda907f2da).

Your mission is to resume and execute the UI Redesign & Guidelines Compliance Track (Milestones 3, 4, and 5):

1. Read the previous sub-orchestrator's scope and progress under d:\Personal Projects\Expense trackinig\.agents\sub_orch_impl\.
2. Initialize `BRIEFING.md`, `progress.md`, and `SCOPE.md` in your working directory `d:\Personal Projects\Expense trackinig\.agents\sub_orch_impl_gen2\` to track progress.
3. Observe that global state (`src/lib/store.tsx`) has been implemented, but the rest of the redesign and compliance items (Milestones 4 and 5) are planned.
4. Implement the premium desktop "Liquid Glass / Bento Box" aesthetic:
   - Replace the mobile shell layout with a native-feel left-hand vertical sidebar navigation menu.
   - Restructure the main dashboard into a CSS Grid "Bento Box" dashboard.
   - Redesign all routes (`/`, `/transactions`, `/analytics`, `/settings`) to use the dark-by-default, glassy surface visual style with deep violet/sky blue accents (`#0A0A0A` background, `rgba(255, 255, 255, 0.03)` card surfaces with backdrop-blur, and electric accents).
   - Rebuild bottom sheets into centered, responsive desktop overlay Dialog components.
5. Ensure 100% compliance with Vercel Web Interface Guidelines:
   - Add focus rings (`focus-visible:ring-2`) and aria-labels to interactive elements.
   - Use tabular numbers (`tabular-nums`) for currency lists/tables.
   - Mask/blur currency amounts globally when Privacy Mode is enabled.
   - Replace all triple dots `...` with exact ellipsis `…` in UI text.
   - Remove emojis from icons.
6. Verify that the application compiles and builds successfully (`npm run build`).
7. Write your handoff report `d:\Personal Projects\Expense trackinig\.agents\sub_orch_impl_gen2\handoff.md` and send a message to the parent Project Orchestrator once complete.

Mandatory Integrity Warning:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
