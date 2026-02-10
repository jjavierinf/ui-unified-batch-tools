# Unified Batch Tools

Next.js UI for managing SQL-based data pipelines. Provides file browsing, SQL editing with diff, submit/approval workflows, and drag-and-drop pipeline task ordering.

Built as a standalone scaffold with mock data — no backend required.

## Quick Start

```bash
cd ui
npm install
npm run dev
# http://localhost:3000
```

## Documentation

- [**SHOWCASE.md**](docs/SHOWCASE.md) — Feature walkthrough with screenshots
- [**IDEAS.md**](docs/IDEAS.md) — Backlog of future improvements

## Reference

- `dags/` — Real Airflow DAGs used as reference for mock data naming
- `plugins/` — Airflow plugins (context only, not used by the UI)
