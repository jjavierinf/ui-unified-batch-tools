# Reality matrix — 13-feb

| Item | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Nombres genéricos (pipelines/tablas) | missing | `ui/src/lib/mock-data.ts`, `ui/src/lib/pipeline-mock-data.ts`, `scripts/setup-test-repo.sh` | Hay nombres que sugieren modelo (Account/CRM/Game/etc). Se debe sanitizar en mock + fixture. |
| Pro tasks list = Simple | partial | `ui/src/components/PipelineSidebarPanel.tsx` | Pro usa lista compacta distinta; Simple usa cards. |
| DQA 1 task = 1 o 2 files | partial | `ui/src/lib/types.ts` (`DqaConfig`) | Config soporta 2 files, pero UX no: click abre 1 file y mapping no contempla el 2do file. |

