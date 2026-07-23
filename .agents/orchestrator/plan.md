# Plan — SLPlayer Premium Desktop Redesign & Verification

This plan outlines the steps, roles, and milestones for the SLPlayer Personal Expense Tracker UI Redesign, Vercel Web Interface Guidelines Audit, and E2E Testing.

## Objectives

1. **Desktop UI Redesign**: Transform mobile shell into a premium desktop layout with sidebar nav, Bento Box dashboard grid, glassmorphism card styling, OLED black background, and centered responsive dialogs.
2. **Vercel Guidelines Audit**: Complete audit to ensure 100% compliance (aria-labels, focus indicators, tabular-nums for finance, exact ellipsis `…`).
3. **E2E Testing Track**: Implement a comprehensive opaque-box test suite covering Tiers 1-4 using Playwright (~82 tests), and run automated visual and functional verification.

## Milestone Status & Topology

We decompose the project into two main parallel tracks under the top-level Project Orchestrator:

1. **UI & Logic Track (sub_orch_impl)**:
   - Milestone 3: Global State & Privacy Mode (Active, worker_m3 in-progress)
   - Milestone 4: Desktop Layout & Bento Box Dashboard (Planned)
   - Milestone 5: Page Redesign & Vercel Guidelines (Planned)
2. **E2E Testing Track (sub_orch_e2e)**:
   - Milestone 2: E2E Test Track Setup & Design (Active, worker_m2_1 in-progress)

```
                       [Project Orchestrator]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [sub_orch_impl] (UI Track)     [sub_orch_e2e] (E2E Track)
         ├── explorer_m3_1/2/3          ├── explorer_m2_1
         └── worker_m3                  └── worker_m2_1
```

## Coordination & Verification Plan

### Phase 1: Exploration & Initialization (Completed)

- [x] Explorer agent analyzing codebase and documenting file structures.
- [x] Plan, briefing, and context files initialized in the orchestrator workspace.

### Phase 2: Parallel Implementation & Test Creation (In Progress)

- **E2E Test Suite Creation**:
  - Worker `worker_m2_1` will install Playwright, configure it, and implement all Tier 1-4 test cases under `tests/`.
  - Reviewers will verify the test infrastructure and compile test configurations.
- **UI & Shared State Implementation**:
  - Worker `worker_m3` will create the global state context (`src/lib/store.tsx`), hook up routing in `__root.tsx`, and enable privacy mode.
  - Next, workers will build the left-hand Sidebar and the Bento Box Dashboard Grid.
  - Center dialogs (Quick Add, Converter) will replace mobile bottom-sheets.
  - Vercel compliance items (aria-labels, tabular-nums, `focus-visible`, curly quotes, `…`) will be audited and implemented.

### Phase 3: Guidelines Compliance & Visual Audit

- Reviewer agents will audit UI changes against the Vercel Web Interface Guidelines.
- Reviewers will verify accessibility focus rings and verify layout on screens from 1024px to 1920px (no cropping).

### Phase 4: Integration Testing & Verification

- Once the UI is built and tests are ready (`TEST_READY.md` published), run the full Playwright E2E suite.
- Run Challenger agents to stress-test the input keypad (rejecting multiple decimal points) and verify settings persistence.
- Perform a Forensic Audit (`teamwork_preview_auditor`) to ensure no hardcoding or dummy implementations were used.

### Phase 5: Handoff & Release

- Synthesize all subagent results into the final report.
- Deliver the final working application and test results to the user.
