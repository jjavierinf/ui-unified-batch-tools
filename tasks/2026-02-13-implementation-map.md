# Implementation map — 13-feb (phase-22..24)

## 1) Nombres genéricos (pipelines / tablas / queries)
- Mock dags + tasks:
  - `/Users/javier/ui-scaffold/ui/src/lib/pipeline-mock-data.ts`
  - `/Users/javier/ui-scaffold/ui/src/lib/mock-data.ts`
- SQL Explorer dataset:
  - `/Users/javier/ui-scaffold/ui/src/lib/sql-explorer-mock.ts`
- Repo fixture (git backend demo):
  - `/Users/javier/ui-scaffold/scripts/setup-test-repo.sh`
- QA: `rg` para asegurarnos que no quede vocabulario “real” (Account/CRM/Game/etc).

## 2) Pro tasks list = Simple tasks list
- Pro context panel:
  - `/Users/javier/ui-scaffold/ui/src/components/PipelineSidebarPanel.tsx`
- Reuse:
  - `/Users/javier/ui-scaffold/ui/src/components/pipeline/PipelineTaskCard.tsx`

## 3) DQA multi-file tasks + split editor
- Helpers para mapear tasks <-> files:
  - `/Users/javier/ui-scaffold/ui/src/lib/task-files.ts` (nuevo)
- Places que resuelven `selectedFile -> task/pipeline`:
  - `/Users/javier/ui-scaffold/ui/src/components/Sidebar.tsx`
  - `/Users/javier/ui-scaffold/ui/src/components/PipelineContextIndicator.tsx`
  - `/Users/javier/ui-scaffold/ui/src/components/PipelineSidebarPanel.tsx`
- Click de task DQA compare abre split editor:
  - `/Users/javier/ui-scaffold/ui/src/components/pipeline/PipelineDetail.tsx`
  - `/Users/javier/ui-scaffold/ui/src/components/PipelineSidebarPanel.tsx`
  - `/Users/javier/ui-scaffold/ui/src/components/pipeline/DqaSplitEditorSlideOut.tsx` (nuevo)
- Mock tasks + config:
  - `/Users/javier/ui-scaffold/ui/src/lib/pipeline-mock-data.ts`
  - `/Users/javier/ui-scaffold/ui/src/lib/mock-data.ts`

## Visual validation
- Playwright screenshots (dark):
  - Pipeline list + SQL Explorer muestran nombres genéricos.
  - Pro tasks list se ve igual que Simple.
  - DQA compare abre split editor con 2 queries.

