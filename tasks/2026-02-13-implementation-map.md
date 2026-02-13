# Implementation map — 13-feb (phase-22..)

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
- (Opcional) Pro folder focus view:
  - `/Users/javier/ui-scaffold/ui/src/components/EditorPanel.tsx`
- Reuse:
  - `/Users/javier/ui-scaffold/ui/src/components/pipeline/PipelineTaskCard.tsx`

## 3) DQA multi-file tasks + split editor
- Model/UI behavior:
  - Task -> files mapping helper (nuevo):
    - `/Users/javier/ui-scaffold/ui/src/lib/task-files.ts` (propuesto)
  - Places that map `selectedFile -> task/pipeline`:
    - `/Users/javier/ui-scaffold/ui/src/components/Sidebar.tsx`
    - `/Users/javier/ui-scaffold/ui/src/components/PipelineContextIndicator.tsx`
    - `/Users/javier/ui-scaffold/ui/src/components/PipelineSidebarPanel.tsx`
- Simple mode click -> open editor:
  - `/Users/javier/ui-scaffold/ui/src/components/pipeline/PipelineDetail.tsx`
  - Nuevo split slideout:
    - `/Users/javier/ui-scaffold/ui/src/components/pipeline/DqaSplitEditorSlideOut.tsx`
- Mock tasks + config:
  - `/Users/javier/ui-scaffold/ui/src/lib/pipeline-mock-data.ts`
  - `/Users/javier/ui-scaffold/ui/src/lib/mock-data.ts`

## Visual validation
- Playwright screenshots (dark mode):
  - Pro tasks list looks identical to Simple cards.
  - DQA compare task click opens split editor with both queries visible.
  - SQL Explorer and Pipeline tables show anonymized names.

