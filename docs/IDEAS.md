# Ideas & Future Improvements

## UI/UX
- Resizable sidebar panel (drag to resize explorer width)
- Keyboard shortcut overlay (show all shortcuts in a modal)
- Breadcrumb navigation in editor tab bar (clickable path segments)
- Multi-tab editor (open multiple files in tabs, like VS Code)
- File search / fuzzy finder (Cmd+P style)
- Syntax-aware SQL autocompletion in Monaco
- Line-level comments on diff view (like GitHub PR reviews)
- Collapsible diff panel (toggle visibility)
- Pipeline DAG visualization (graphical node/edge view of task dependencies)
- Toast notifications for save/submit/approve actions
- Drag-to-reorder confirmation (undo last reorder)

## Data & Backend
- Parse crontab to next-run countdown ("Next run in 2h 15m")
- Real-time collaboration indicators (who else is editing)
- Version history per file (list of past saves with timestamps)
- Export pipeline config as YAML/JSON
- Import existing Airflow DAG definitions
- Validate SQL syntax before submit (basic parse check)

## Performance
- Virtualized file tree for large repos (1000+ files)
- Lazy-load Monaco editor (reduce initial bundle)
- Debounce store persistence to reduce localStorage writes
