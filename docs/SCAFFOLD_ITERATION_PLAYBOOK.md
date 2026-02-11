# Scaffold Iteration Playbook

This playbook is for implementing UI scaffold batches with strong visual validation and changelog traceability.

## Preconditions
1. Use an explicit active plan chosen by the user (or generate one from `tasks/_scaffold-plan-template.md`).
2. Test repo ready:
   - `bash scripts/setup-test-repo.sh /tmp/test-pipeline-repo`
3. UI run:
   - `cd ui`
   - `EXTERNAL_REPO_PATH=/tmp/test-pipeline-repo npm run dev`

## Skills To Use
- `playwright`: browser automation + deterministic flow checks.
- `screenshot`: desktop/window captures when Playwright is not enough.
- `doc`: only if a deliverable requires `.docx`.

## Per-Iteration Workflow
1. Pick exactly one grouped phase (or a clearly bounded subset).
2. Implement code changes.
3. Run quality checks:
   - `cd ui && npm run lint`
   - `cd ui && npm run build`
4. Run visual QA flow:
   - open app,
   - execute impacted user flow,
   - capture before/after screenshots.
5. Update `docs/CHANGELOG.md` with:
   - What changed.
   - What is scaffold-mocked.
   - What TODO hooks were added for future real integration.
   - Screenshot evidence file paths.

## Screenshot Conventions
- Save under `docs/screenshots/` with stable names.
- Prefer descriptive names by feature and phase, for example:
  - `phase1-folder-selection.png`
  - `phase1-resizable-sidebar.png`
  - `phase2-tab-sql-explorer.png`
- Keep old screenshots unless explicitly replacing obsolete ones.

## Visual Acceptance Checklist
- No overlapping/clipped critical UI text.
- Selected state is always obvious (file, folder, task, mode).
- Status badges are visible and consistent across simple/pro views.
- Mode switches do not lose context unexpectedly.
- Search behavior remains intuitive when switching modes.

## Scaffold Quality Rules
- Keep mocked behavior explicit in UI copy and/or changelog notes.
- For any mocked integration path (PRs, DB execution, notifications), add focused `#TODO` markers in code.
- Avoid premature deep backend coupling in the scaffold phase.

## Done Criteria (Iteration)
- Functional scope met for selected phase.
- Lint + build pass.
- Visual evidence captured.
- Changelog updated.
- Remaining gaps documented (no hidden assumptions).
