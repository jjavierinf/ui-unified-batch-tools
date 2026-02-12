# 2026-02-11 — Phase 4 Pipeline Cohesion + YAML-Driven Task Config

Alcance implementado:
- Cohesión visual/funcional entre overview, detail y pro sidebar para contexto DAG.
- Configuración de task sensible a etapa/tipo alineada al contrato de `configfile_proposal.yml`.
- Agrupación dinámica de pipelines (`by tag` / `by integration`) con columna de estado.
- En `Pipelines Pro`, file tree expandido por default, sin creación libre de archivos y handoff limpio sin subtab lateral de pipeline.

## Qué cambió

### Overview: agrupación y estado de pipeline
- `PipelineOverview` soporta toggle real `by tag` y `by integration`:
  - `by integration`: agrupa por carpeta/integración.
  - `by tag`: agrupa por tags funcionales (ej. `snapshot`, `incremental`), no por folder.
- Se agregó columna `Status` con `StatusBadge` calculado por pipeline.
- Nuevo helper `getPipelineStatus(...)` para derivar estado agregado en base a tasks no-DDL.
- Se agregó `Status legend` + botón `cycle` por fila para testear badges en scaffold sin backend.

### Badges: significado y disparadores en scaffold
- `Draft`: estado inicial o edición pendiente.
- `Submitted`: simula push/submit a dev.
- `Pending`: simula envío pendiente de aprobación.
- `Approved`: simula aprobación final.
- Para probarlas en demo: usar botón `cycle` de cada fila (rota `Draft -> Submitted -> Pending -> Approved`).

### Detail: estado agregado en header
- `PipelineDetail` muestra badge de estado del pipeline junto al tipo (`snapshot` / `incremental`).
- El badge usa la misma lógica agregada que el overview para evitar desalineaciones.

### Task Config: campos por etapa/tipo
- `TaskConfigPanel` ahora diferencia explícitamente etapas:
  - `extract`: muestra `Expected Workload` + `Target Table Name`.
  - `transform`: no muestra target connection.
  - `load` y `dqa`: mantienen campos/variantes relevantes.
- Se agregó `targetTableName` al tipo `TaskConfig`.
- Se agrega pie de contexto `Stage · Task type` para lectura rápida.

### Pipelines Pro: contexto DAG desde folder root (handoff)
- Se corrigió la resolución de contexto DAG desde `selectedFolder` aun cuando no hay `selectedFile`.
- Se quitó la subtab lateral `Pipeline`.
- En su lugar se muestra una tarjeta compacta de contexto con CTA `Open pipeline handoff`.

### Guardrail de scaffold en Pro
- Se quitó creación libre de SQL desde el file tree en `Pipelines Pro`.
- Mensaje explícito: creación de archivos solo vía flujos de pipeline.

### What&apos;s New híbrido (checklist + tour)
- Se agregó botón `What&apos;s new` en header con modal híbrido:
  - checklist del plan (`done/current/next/out`),
  - CTA `Start guided tour`.
- Se integró tour guiado con `react-joyride` sobre puntos clave de F4.
- Se agregó acceso rápido al PDF actual en header (`Current PDF`) y en ruta `/changelog/current`.

## Evidencia visual

### Overview grouped by tag + status lab (dark)
![Phase 4 group by tag status lab dark](../screenshots/phase4-group-by-tag-status-lab-dark.png)

Qué mirar:
- Toggle `by tag` activo y grupos distintos (`snapshot` / `incremental`).
- `Status legend` visible con significados.
- Botones `cycle` por fila para probar estados en scaffold.

### Overview grouped by integration + status (dark)
![Phase 4 group by integration status dark](../screenshots/phase4-group-by-integration-status-dark.png)

Qué mirar:
- Toggle `by integration` activo.
- Columna `Status` visible por pipeline.
- Agrupación cambia de tags a integración sin romper conteos.

### Status cycle en scaffold (dark)
![Phase 4 status cycle scaffold dark](../screenshots/phase4-status-cycle-scaffold-dark.png)

Qué mirar:
- Pipeline de ejemplo cambia de `Draft` a `Submitted`.
- Cambio visible en badge de fila sin salir del overview.

### Pipeline detail con status badge (dark)
![Phase 4 pipeline detail status dark](../screenshots/phase4-pipeline-detail-status-dark.png)

Qué mirar:
- En el header del detalle aparece badge de estado agregado.
- Estado visible junto a tipo y metadata DAG.

### Task config extract (dark)
![Phase 4 task config extract dark](../screenshots/phase4-task-config-extract-dark.png)

Qué mirar:
- Task `EXTRACT` con `Expected Workload` y `Target Table Name`.
- `Target Connection` visible para extract.

### Task config dqa (dark)
![Phase 4 task config dqa dark](../screenshots/phase4-task-config-dqa-dark.png)

Qué mirar:
- Task `DQA` expone opciones de validación/alerta.
- Pie `Stage · Task type` visible para contexto rápido.

### Pro explorer expandido (dark)
![Phase 4 pro explorer expanded dark](../screenshots/phase4-pro-explorer-expanded-dark.png)

Qué mirar:
- Tree aparece expandido por default en primera carga.
- Stages `extract/transform/load/dqa/ddl` quedan visibles sin navegación extra.

### Pro handoff context (dark)
![Phase 4 pro handoff context dark](../screenshots/phase4-pro-handoff-context-dark.png)

Qué mirar:
- No existe subtab lateral `Pipeline`.
- Aparece tarjeta `Pipeline context` con botón `Open pipeline handoff` para saltar al detalle en `Simple`.

### What&apos;s New checklist (dark)
![Phase 4 whats new checklist dark](../screenshots/phase4-whats-new-checklist-dark.png)

Qué mirar:
- Modal con checklist del plan (done/current/next/out-of-scope).
- CTA `Start guided tour`.
- Link `Current PDF` visible en header.

### What&apos;s New guided tour (dark)
![Phase 4 whats new joyride dark](../screenshots/phase4-whats-new-joyride-dark.png)

Qué mirar:
- Tooltip de Joyride con navegación de pasos.
- Spotlight sobre elementos clave (`Pipelines`, agrupación, badges, PDF).

## Límites scaffold
- Contrato YAML aplicado a nivel UI/configuración, sin validación semántica profunda runtime.
- El status agregado usa estado local de archivos/tasks mock.

## TODO hooks
- Conectar validación de `TaskConfig` a parser real del YAML de contrato.
- Reusar status agregado en futuras vistas de auditoría/approvals para evitar lógica duplicada.

## Calidad
- `cd ui && npm run lint` (ok, warnings existentes no bloqueantes).
- `cd ui && npm run build` (ok).
- Validación visual en Chrome (Playwright) con screenshots dark mode.
