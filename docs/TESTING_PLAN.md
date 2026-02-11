# Testing Plan — Unified Batch Tools UI

## Stack recomendado

| Herramienta | Uso |
|-------------|-----|
| **Vitest** | Unit + integration tests (compatible con Vite/Turbopack, mas rapido que Jest) |
| **@testing-library/react** | Component rendering + interaction tests |
| **MSW** (Mock Service Worker) | Mock de API routes (`/api/git/*`) |
| **Playwright** | E2E tests (browser automation) |
| `vi.useFakeTimers()` | Tests de cron-utils, toast auto-dismiss |
| `vi.mock()` | Mock de simple-git, localStorage |

## Coverage targets

- **Utilities (lib/)**: >90% — son funciones puras, faciles de testear
- **Stores (Zustand)**: >80% — state mutations + persistence
- **Components**: >70% — rendering + interacciones criticas
- **API routes**: >80% — request/response contracts
- **E2E**: top 5 workflows del usuario

---

## Fase 1: Unit Tests — Utilities (puras, sin deps)

### 1.1 `file-utils.ts` — `buildTree()`

```
Tests:
- Flat paths → nested tree structure
- Files sort before folders (alphabetical)
- Deep nesting (5+ levels)
- Single file (no folders)
- Empty input → empty array
- Paths con caracteres especiales
```

### 1.2 `cron-utils.ts` — `describeCron()`, `nextRunMinutes()`, `formatNextRun()`

```
Tests:
- describeCron:
  - "0 * * * *" → "Every hour"
  - "7 0,3,6,9,12,15,18,21 * * *" → "Every 3h"
  - "0 6 * * *" → "Daily at 06:00"
  - "*/15 * * * *" → "Every 15 min"
  - Input invalido → fallback string
- nextRunMinutes:
  - Mock Date.now() a un valor fijo
  - Verificar calculo correcto para cada patron
  - Null para cron invalido
- formatNextRun:
  - 0 → "< 1m"
  - 45 → "45m"
  - 90 → "1h 30m"
  - 1440 → "24h 0m"
```

### 1.3 `task-type-utils.ts` — `getStageFromPath()`, `isDdlTask()`, `isDdlPath()`

```
Tests:
- isDdlPath("/ddl/create_table.sql") → true
- isDdlPath("/transformations/data_model.sql") → false
- isDdlTask("create_table_stage", "/ddl/...") → true
- getStageFromPath("/transformations/...") → "transform"
- getStageFromPath("/dml/...") → "transform"
```

### 1.4 `pipeline-mock-data.ts` — `getNonDdlTasksForPipeline()`

```
Tests:
- Filtra correctamente por dagName
- Excluye DDL tasks del resultado
- Ordena por campo `order`
- dagName inexistente → array vacio
```

---

## Fase 2: Unit Tests — Zustand Stores

### 2.1 `auth-store.ts`

```
Tests:
- login("data-engineer") → currentUser = { name: "Data Engineer", role: "user" }
- login("team-leader") → currentUser = { name: "Team Leader", role: "leader" }
- login("unknown") → currentUser = null
- logout() → currentUser = null
- Persist: login → localStorage tiene auth-store-v1
```

### 2.2 `store.ts` (EditorStore)

```
Tests — State mutations:
- selectFile(path) → selectedFile actualizado
- updateContent(path, "new") → files[path].content = "new", status = "draft"
- saveFile(path) → savedContent = content (+ mock fetch /api/git/save)
- toggleFolder(path) → Set add/delete
- createFile(path) → files[path] creado, selectedFile = path
- toggleDarkMode() → darkMode flipped

Tests — Status transitions:
- submitFile(path, "dev") → status = "submitted"
- submitFile(path, "prod") → status = "pending_approval"
- approveFile(path) → status = "approved"
- rejectFile(path) → status = "draft"

Tests — Persistence:
- expandedFolders: Set → Array (serialization) → Set (deserialization)
- Round-trip: set state → read localStorage → verify
```

### 2.3 `pipeline-store.ts`

```
Tests:
- selectPipeline(dagName) → selectedPipeline set
- reorderTask(dag, 0, 2) → tasks reordenadas, order fields actualizados
- updateDagSchedule(dag, "0 * * * *") → config.schedule actualizado
- addDagTag(dag, "new_tag") → tags incluye "new_tag"
- addDagTag(dag, "existing") → no duplicados
- removeDagTag(dag, "tag") → tags no incluye "tag"
- updateDagField(dag, "owner", "javier") → config.owner = "javier"
- updateTaskConfig(taskId, {...}) → taskConfigs actualizado
```

### 2.4 `toast-store.ts`

```
Tests:
- addToast("msg", "success") → toast en array con id unico
- Auto-dismiss despues de 3000ms (vi.useFakeTimers)
- removeToast(id) → toast eliminado
- Multiple toasts coexisten
```

---

## Fase 3: Integration Tests — API Routes

Usar `NextRequest`/`NextResponse` mocks o test helpers de Next.js.

### Setup comun

```
Mock git-service.ts completamente (vi.mock):
- getStatus() → { branch: "dev", modified: [], log: [] }
- saveFile() → { success: true }
- submitToDev() → { commitHash: "abc123" }
- submitToProd() → { branch: "feat/xyz" }
- approveProd() → { merged: true }
```

### Tests por route

```
GET /api/git/status:
  - 200 + GitStatus object
  - 500 cuando git-service throws

POST /api/git/save:
  - 200 con { filePath, content } valido
  - 400 sin filePath o content

POST /api/git/submit-dev:
  - 200 con commit hash
  - 500 cuando merge falla

POST /api/git/submit-prod:
  - 200 con MergeRequestInfo
  - No hace merge automatico (verificar que approveProd NO se llama)

POST /api/git/approve-prod:
  - 200 con merge info
  - Solo mergea a main
```

---

## Fase 4: Component Tests (React Testing Library)

### Prioridad alta

| Componente | Que testear |
|-----------|-------------|
| `FileTreeNode` | Click file → selectFile(), click folder → toggleFolder(), icono cambia expand/collapse |
| `EditorPanel` | Placeholder sin file, muestra editor con file, diff panel toggle |
| `EditorActionButtons` | Save → saveFile(), Submit → submitFile(), buttons disabled sin file |
| `CronInput` | Input cambia → onChange, muestra descripcion legible, validacion |
| `TagEditor` | Add tag, remove tag, no duplicates, autocomplete |
| `PipelineTaskCard` | Render task name + stage badge, click → callback |
| `StatusBadge` | Mapea status → color + label correctos |
| `AuthGuard` | Con user → children, sin user → LoginScreen |
| `LoginScreen` | Click Data Engineer → login(), Click Team Leader → login() |

### Prioridad media

| Componente | Que testear |
|-----------|-------------|
| `PipelineDetail` | DragDrop reorder, config editor, + Add task form |
| `SqlEditorSlideOut` | Abre con file, Diff toggle, Close, "Open in Code Mode" |
| `DagConfigEditor` | Schedule/Tags/Fields updates propagate |
| `Sidebar` | Explorer vs Pipeline tab, file count badge, Pipeline context |
| `QuickOpen` | Cmd+K abre, search filtra, Enter selecciona |

---

## Fase 5: E2E Tests (Playwright)

### Setup

```bash
# playwright.config.ts
baseURL: "http://localhost:3000"
# Seed localStorage before each test for deterministic state
```

### Workflows criticos

**1. Login → Edit → Save**
```
1. Navegar a /
2. Click "Data Engineer"
3. Expandir tree → click data_model_task.sql
4. Editar contenido en Monaco
5. Cmd+S
6. Verificar toast "File saved"
7. Verificar CHANGES panel muestra "No changes"
```

**2. Submit to Dev**
```
1. Login + abrir archivo
2. Editar contenido
3. Click "Submit to Dev" (o el boton de Dev)
4. Verificar status badge → "Submitted"
5. Verificar toast de confirmacion
```

**3. Submit to Prod + Approval**
```
1. Login como Data Engineer
2. Switch a Prod
3. Editar + Submit
4. Verificar status → "Pending"
5. Logout → Login como Team Leader
6. Verificar ApprovalPanel visible
7. Click Approve
8. Status → "Approved"
```

**4. Pipeline Task Reorder**
```
1. Login → Pipelines tab
2. Click en dbo_AccountReference
3. Drag task #1 → position #3
4. Verificar nuevo orden en UI
5. Reload → verificar persistencia
```

**5. Cross-view Navigation**
```
1. Pipeline Mode → click task → slide-out abre
2. Click "Open in Code Mode" → switches to editor
3. Code Mode → Pipeline sidebar tab → shows pipeline info
4. Click "Open in Pipeline Mode" → switches back
```

---

## Orden de implementacion sugerido

| Paso | Que | Esfuerzo | Valor |
|------|-----|----------|-------|
| 1 | Setup Vitest + RTL | 1h | Base |
| 2 | Tests file-utils + cron-utils + task-type-utils | 2h | Alto |
| 3 | Tests auth-store + workspace-store + toast-store | 1h | Medio |
| 4 | Tests editor-store (state mutations + persistence) | 2h | Alto |
| 5 | Tests pipeline-store (reorder + config updates) | 2h | Alto |
| 6 | Tests API routes (mock git-service) | 2h | Medio |
| 7 | Tests componentes prioritarios (CronInput, TagEditor, StatusBadge) | 2h | Alto |
| 8 | Tests componentes complejos (EditorPanel, PipelineDetail) | 3h | Alto |
| 9 | Setup Playwright + E2E login flow | 2h | Medio |
| 10 | E2E workflows (edit, submit, approve, reorder) | 4h | Alto |

**Total estimado: ~21h de desarrollo**

---

## Notas

- Monaco Editor no renderiza en jsdom — usar mocks para SqlEditor/SqlDiffViewer en component tests
- @hello-pangea/dnd requiere DragDropContext wrapper en tests
- localStorage mock: `vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), ... })`
- Para E2E: usar `scripts/setup-test-repo.sh` para tener git repo funcional
