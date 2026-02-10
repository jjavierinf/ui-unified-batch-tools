# SQL Pipeline Editor - UI Scaffold

Next.js mock interface that replicates the core workflows of an Airflow-based SQL pipeline system: file browsing, SQL editing, diff review, submit/approval flows, and pipeline task ordering.

**Stack:** Next.js 16 + TypeScript + Monaco Editor + Zustand + Tailwind CSS v4
**Data:** All mock, persisted in localStorage. No backend required.

---

## SQL Editor

Full SQL editing environment with file tree, Monaco editor, and diff viewer.

**Dark mode** — file tree expanded, SQL syntax highlighting, status badges, environment toggle (Dev/Prod):

![Editor - Dark mode](../ui/public/screenshots/01-editor-dark.png)

**Light mode** — same layout, full theme support including Monaco editor theme swap:

![Editor - Light mode](../ui/public/screenshots/02-editor-light.png)

### Key features
- Repo browser sidebar with 21 SQL files organized by integration/table
- File count badge, modified indicators (orange dot), status badges (Draft/Submitted/Pending/Approved)
- Create new `.sql` files via `+` button
- Monaco Editor with full SQL syntax highlighting
- ARIA tree roles and keyboard navigation (Tab, Space/Enter)

---

## Diff Panel

Side-by-side diff comparing current buffer vs last saved version. Collapsible via the CHANGES header chevron.

![Diff panel showing changes](../ui/public/screenshots/05-diff-panel.png)

The diff panel shows inline additions (green) and the original content, just like a git diff. The orange dot on the file name and the "Save all (1)" button in the top bar indicate unsaved changes.

---

## Submit & Approval Flow

Environment toggle (Dev/Prod) controls the submit behavior:
- **Dev submit:** status changes to Submitted
- **Prod submit:** status changes to Pending Approval, showing the approval panel

![Prod approval flow](../ui/public/screenshots/06-approval-flow.png)

The approval panel shows submission timestamp and Approve/Reject buttons. Toast notifications confirm each action. Note the "Pending" badge in both the file tab and the tree node.

---

## Quick File Search (Cmd+P)

VS Code-style modal with fuzzy filtering across all 21 SQL files. Arrow keys to navigate, Enter to open, Esc to close.

![Quick open filtering "game"](../ui/public/screenshots/03-quick-open.png)

---

## Keyboard Shortcuts (Cmd+?)

Overlay listing all available shortcuts. Global Cmd+S saves the current file from any view with toast feedback.

![Keyboard shortcuts overlay](../ui/public/screenshots/04-shortcuts.png)

---

## Pipeline Overview ---- el split de proyect deberia ser por tag en lugar de por folder

All DAG configurations grouped by integration, with search/filter, type badges, cron schedule descriptions, and next-run countdowns.

**Dark mode:**

![Pipeline overview - Dark](../ui/public/screenshots/07-pipeline-overview.png)

**Light mode:**  
#TODO: los create tables no deberian estar en el overview, lo manejamos por atras nosotros
#TODO: si necesitan un ddl ad hoc para campos distintos al default si pueden crearlo 

![Pipeline overview - Light](../ui/public/screenshots/09-pipeline-light.png)

---

## Pipeline Detail

Per-pipeline view with configuration editor and drag-and-drop task ordering.

![Pipeline detail with task ordering](../ui/public/screenshots/08-pipeline-detail.png)

### Configuration
- **Cron input:** live validation indicator, 5/5 part counter, preset buttons (Hourly, Every 3h, Daily 6am, Every 15m)
- **Tag editor:** autocomplete from existing tags, chip display with remove, keyboard navigation
- **Next-run countdown** in accent color (e.g., "Next in 1h 14m")

### Task Ordering
- Drag-and-drop reorderable task list (5 tasks per pipeline)
- Task cards with order badge (#1-#5), stage badge (EXTRACT/TRANSFORM/LOAD/DQA), SQL filename
- Color-coded left borders per stage type
- Connector arrows between tasks
- Order persisted to localStorage

---

## Bonus Features

| Feature | Access | Description |
|---------|--------|-------------|
| Quick File Search | `Cmd+P` | Fuzzy-filter and jump to any SQL file |
| Keyboard Shortcuts | `Cmd+?` | Overlay listing all shortcuts |
| Global Save | `Cmd+S` | Saves current file with toast feedback |
| Toast Notifications | Automatic | Slide-in toasts (3s auto-dismiss) on save/submit/approve/reject |
| Next-Run Countdown | Pipelines | Cron parser shows relative time until next execution |
| Collapsible Diff | Click header | Toggle CHANGES panel visibility |
| Dark / Light Mode | Top bar icon | Full theme support including Monaco Editor |
| Keyboard Accessibility | Tab navigation | Focus-visible rings, ARIA roles on all interactive elements |

---

## Architecture

```
ui/src/
├── app/
│   ├── layout.tsx              # Root + global overlays
│   ├── editor/page.tsx         # SQL Editor page
│   └── pipelines/page.tsx      # Pipeline orchestration page
├── lib/
│   ├── store.ts                # Editor store (Zustand + persist)
│   ├── pipeline-store.ts       # Pipeline store (Zustand + persist)
│   ├── toast-store.ts          # Toast notification store
│   ├── types.ts                # Shared TypeScript types
│   ├── mock-data.ts            # 21 SQL files
│   ├── pipeline-mock-data.ts   # 25 tasks across 5 DAGs
│   ├── cron-utils.ts           # Cron parser + next-run calculator
│   └── file-utils.ts           # Flat paths -> tree builder
├── components/
│   ├── Sidebar / FileTree / FileTreeNode
│   ├── EditorPanel / SqlEditor / SqlDiffViewer
│   ├── EditorActionButtons / ApprovalPanel / StatusBadge
│   ├── EnvironmentToggle / ToastContainer
│   ├── QuickOpen / KeyboardShortcuts
│   └── pipeline/
│       ├── PipelineBoard / PipelineOverview / PipelineDetail
│       ├── PipelineNav / PipelineTaskCard
│       └── CronInput / TagEditor
```

## Running

```bash
cd ui && npm install && npm run dev
# http://localhost:3000
```
