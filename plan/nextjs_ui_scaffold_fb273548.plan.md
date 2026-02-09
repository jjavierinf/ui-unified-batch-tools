---
name: Nextjs_ui_scaffold
overview: Scaffold a Next.js UI inside the repo with mocked data and flows that mirror the final repo/diff/submit/approval/pipeline-ordering behavior, without real integrations.
todos:
  - id: scaffold-app
    content: Create Next.js app in /home/javierinfantino/repos/dags/ui
    status: in_progress
  - id: mock-layer
    content: Add mock data models + localStorage persistence
    status: pending
    dependencies:
      - scaffold-app
  - id: repo-browser
    content: Build repo tree + SQL-only create/edit flows
    status: pending
    dependencies:
      - mock-layer
  - id: editor-diff
    content: Implement editor + diff tab vs lastSaved snapshot
    status: pending
    dependencies:
      - mock-layer
  - id: submit-approval
    content: Mock submit dev/prod + approval state transitions
    status: pending
    dependencies:
      - mock-layer
  - id: pipeline-order
    content: Drag/drop task order + persistence
    status: pending
    dependencies:
      - mock-layer
  - id: dag-config
    content: Schedule/tags config UI per pipeline
    status: pending
    dependencies:
      - mock-layer
---

# Next.js UI Scaffold Plan

## Scope

- Create a new Next.js app under `/home/javierinfantino/repos/dags/ui` with mock data and local persistence.
- Implement UI flows: repo browser, SQL editor + diff, submit dev/prod with approval states, pipeline task ordering, and DAG config form.

## Implementation

- **App scaffold**: Initialize Next.js app in [`/home/javierinfantino/repos/dags/ui`](/home/javierinfantino/repos/dags/ui)( /home/javierinfantino/repos/dags/ui ), set up routes and base layout.
- **Mock data layer**: Create in-app fixtures for folders/files, file metadata, pipeline config, and task order; use localStorage for persistence.
- **Repo browser**: Build tree view that filters to `.sql` only and enforces SQL-only creation.
- **SQL editor + diff**: Editor tab and diff tab that compare current buffer vs last saved mock snapshot.
- **Submit flow**: Dev submit = state change; Prod submit = request approval, then approve action to merge; show status badges.
- **Pipeline ordering**: Drag/drop list of tasks (SQL filenames without extension), persist order in localStorage.
- **DAG config**: Schedule interval + tags per pipeline; store in mock metadata; display in pipeline view.
- **MCP Chrome validation**: After each feature, run MCP Chrome validation with a visible checklist of expected behaviors.

## Files/Areas

- New app at [`/home/javierinfantino/repos/dags/ui`](/home/javierinfantino/repos/dags/ui)( /home/javierinfantino/repos/dags/ui ).
- UI components under `ui/src/components/*`.
- Mock data + storage helpers under `ui/src/lib/*`.

## Testing/Verification

- MCP Chrome validation after each feature with checklist:
- Repo browser: tree renders, SQL-only filtering, create SQL file blocked for non-sql names.
- Editor/diff: edit buffer updates, diff shows changes vs last saved, save updates baseline.
- Submit flow: dev submit updates status, prod submit creates pending approval, approve merges state.
- Pipeline order: drag/drop changes order, refresh preserves order.
- DAG config: schedule/tags save and render on reload.