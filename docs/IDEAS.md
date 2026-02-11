# Ideas & Future Improvements

## Completed
- ~~Collapsible diff panel (toggle visibility)~~ - Done
- ~~Parse crontab to next-run countdown~~ - Done
- ~~Pipeline DAG visualization~~ - Replaced by pipeline detail with task ordering
- ~~Export pipeline config as YAML/JSON~~ - Available via DagConfigEditor

## UI/UX
- Resizable sidebar panel (drag to resize explorer width)
- Breadcrumb navigation in editor tab bar (clickable path segments)
- Multi-tab editor (open multiple files in tabs, like VS Code)
- Syntax-aware SQL autocompletion in Monaco
- Line-level comments on diff view (like GitHub PR reviews)
- Drag-to-reorder confirmation (undo last reorder)
- YAML config editor (Monaco in YAML mode for advanced users)
- Virtual .yaml files in file tree (generated from dagConfigs)
- Approval dashboard for Team Leader role (list all pending approvals)
- Batch submit (select multiple files and submit all at once)
- File rename/move from sidebar context menu

## Data & Backend
- Real-time collaboration indicators (who else is editing)
- Version history per file (list of past saves with timestamps)
- Import existing Airflow DAG definitions
- Validate SQL syntax before submit (basic parse check)
- Replace direct merge with PR creation via Bitbucket API
- Git conflict detection and resolution UI
- Webhook notifications on submit/approve (Mattermost/Slack)
- Read SQL files from git repo on startup (replace mock data entirely)

## Performance
- Virtualized file tree for large repos (1000+ files)
- Lazy-load Monaco editor (reduce initial bundle)
- Debounce store persistence to reduce localStorage writes
- SSR for initial page load (reduce client-side hydration)
