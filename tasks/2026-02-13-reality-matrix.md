# Reality matrix — 13-feb

| Item | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Nombres genéricos (pipelines/tablas) | partial | `scripts/setup-test-repo.sh`, `ui/src/lib/*mock*` | Hay nombres que sugieren modelo (Account/CRM/Game/etc). Hay que sanitizar en mock + fixture. |
| Pro tasks list = Simple | missing | `ui/src/components/PipelineSidebarPanel.tsx` | Pro usa lista compacta; Simple usa `PipelineTaskCard`. |
| DQA 1 task = 1 o 2 files | partial | `ui/src/lib/types.ts` (`DqaConfig`), `pipeline-mock-data.ts` | Config soporta 2 files, pero UX no: click abre 1 file; mapping selectedFile->task no contempla 2do file. |

