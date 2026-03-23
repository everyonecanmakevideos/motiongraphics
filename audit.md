# Codebase Audit

## 1. Project Overview

This project is an AI-assisted motion graphics generation system built on Next.js and Remotion.

Its intended product shape is clear:
- Take a natural-language prompt.
- Route it into either a structured template pipeline or a legacy freeform generation pipeline.
- Render a video with Remotion.
- Store artifacts in R2.
- Expose job progress and playback through a Next.js app.

### Current stack

- Frontend and API: Next.js App Router
- Rendering: Remotion 4
- UI runtime: React 19
- Validation: Zod
- Database: Neon Postgres
- Storage: Cloudflare R2 via S3 SDK
- AI: OpenAI SDK

### Actual architecture

There are really two systems living inside one repo:

1. Template pipeline
- `app/api/jobs/route.ts` creates a job and enqueues it.
- `lib/queue.ts` runs the pipeline.
- `lib/pipeline/intentAnalyzer.ts` chooses a template and params.
- `lib/templates/creativeEnhancer.ts` decorates the analyzer output.
- `lib/templates/resolver.ts` validates template params.
- `lib/pipeline/templateRenderer.ts` renders the template scene directly.

2. Legacy fallback pipeline
- `lib/pipeline/promptExpander.ts` expands the prompt.
- `lib/pipeline/specGenerator.ts` creates a sparse motion spec.
- `lib/pipeline/codeGenerator.ts` generates JSX.
- `lib/pipeline/renderer.ts` writes `src/GeneratedMotion.tsx`, renders it, uploads artifacts.

### Data flow

Request flow:
- `POST /api/jobs`
- `createJob()` inserts into Postgres
- `enqueueJob()` adds job to in-memory queue
- `runPipeline()` chooses template path first
- if template path fails or declines, it falls back to legacy path
- render artifacts upload to R2
- UI reads progress via polling and SSE
- asset playback goes through `/api/assets?key=...`

### Core modules and responsibilities

- `lib/db.ts`: persistence, schema init, job updates
- `lib/queue.ts`: orchestration, fallback switching, status emission
- `lib/pipeline/*`: prompt/spec/code/render stages
- `src/templates/*`: template implementations and schemas
- `src/templates/templateDescriptors.ts`: shared manifest/schema registry
- `lib/templates/*`: resolver, multi-scene logic, creative layer
- `lib/r2.ts`: artifact storage

### Product alignment

The template-first direction aligns with the intended product vision.
The legacy raw-code-generation path does not.

That is the biggest strategic fact about this codebase.

The good news:
- the template system is the right foundation
- the app already supports 31 templates
- the user-facing product idea is strong

The bad news:
- the repo is still behaving like a prototype platform, not a production-grade system
- the old fallback path is contaminating architecture, build hygiene, and reliability

## 2. Critical Issues

- **No authentication or authorization on core APIs.**
  - `app/api/jobs/route.ts`
  - `app/api/jobs/[id]/route.ts`
  - `app/api/jobs/[id]/stream/route.ts`
  - `app/api/assets/route.ts`
  - `app/api/studio/props/[jobId]/route.ts`
  - Anyone who can hit the app can create expensive render jobs, inspect any job by ID, and request any R2 key through the asset proxy.

- **The queue is process-local memory, not durable infrastructure.**
  - `lib/queue.ts`
  - Jobs are stored in an array in module scope.
  - Subscribers are stored in a process map.
  - A process restart loses queue state.
  - A second app instance breaks queue correctness and SSE assumptions.
  - This does not scale past a single-node happy path.

- **Legacy fallback mutates source code at runtime.**
  - `lib/pipeline/renderer.ts`
  - `lib/queue.ts`
  - The system writes into `src/GeneratedMotion.tsx` during job execution.
  - That makes runtime behavior depend on mutable source state.
  - It also guarantees dirty working trees and makes concurrent or multi-instance rendering unsafe.

- **TypeScript is currently not green.**
  - `npx tsc --noEmit` fails right now.
  - Verified failures:
    - `components/InlineRemotionPreview.tsx`: `PlayerProps` generic mismatch
    - `components/PromptForm.tsx`: `object` vs `Record<string, unknown>`
  - A production-grade TypeScript repo cannot treat red `tsc` as acceptable.

- **The render pipeline explicitly continues after type failures.**
  - `lib/pipeline/renderer.ts`
  - The code logs TypeScript errors and continues anyway.
  - That is the opposite of safe rendering.

- **The system exposes unrestricted signed asset access.**
  - `app/api/assets/route.ts`
  - `lib/r2.ts`
  - Any key can be requested.
  - There is no ownership check, no namespace check, no tenancy model.

- **Browser security is disabled during rendering.**
  - `lib/pipeline/renderer.ts`
  - `lib/pipeline/templateRenderer.ts`
  - `remotion.config.ts`
  - `--disable-web-security` and `Config.setChromiumDisableWebSecurity(true)` are not acceptable defaults for a production render service.

## 3. High Priority Issues

- **Project direction is split between a clean system and a fragile hack stack.**
  - Template pipeline is the clean direction.
  - Legacy LLM-to-JSX path is a hacky survival path.
  - Right now both are first-class citizens.
  - That makes the system harder to reason about, harder to test, and harder to stabilize.

- **The template system is only partially platformized.**
  - There is a registry pattern now via `src/templates/templateDescriptors.ts`.
  - That is good.
  - But template components are still manually imported and hardcoded in `src/templates/index.ts`.
  - This is not plugin-grade extensibility yet.
  - Adding a template still requires changing core registry files.

- **Background system parity is inconsistent.**
  - `src/templates/types.ts` supports:
    - `solid`
    - `gradient`
    - `stripe`
    - `grain`
    - `dots`
    - `grid`
    - `radial-glow`
  - `src/primitives/Background.tsx` only actually renders:
    - `solid`
    - `gradient`
    - `stripe`
    - `grain`
  - This mismatch is a direct source of visual inconsistency and chart/background bugs.

- **Template pipeline prompt vocabulary is lagging behind template capability.**
  - `lib/pipeline/intentAnalyzer.ts`
  - The analyzer teaches only the old background formats.
  - The creative layer mostly works with the old background set too.
  - Result: templates can technically support more than the AI pipeline reliably asks for.

- **Multi-scene layout math is hardcoded to landscape dimensions.**
  - `lib/templates/multiSceneResolver.ts`
  - Composite region definitions are fixed 1920x1080 rectangles.
  - That breaks portability across portrait/square outputs.

- **Aspect ratio support is internally inconsistent.**
  - `components/PromptForm.tsx` offers `4:5`
  - `app/api/jobs/route.ts` accepts `4:5`
  - `lib/pipeline/templateRenderer.ts` does not support `4:5`
  - `lib/pipeline/templateRenderer.ts` supports `3:4` but the form does not offer it
  - This is a real product bug, not a cosmetic one.

- **Database schema management is happening inside request execution.**
  - `app/api/jobs/route.ts`
  - `app/page.tsx`
  - `app/api/studio/props/[jobId]/route.ts`
  - `initDb()` belongs in migrations/bootstrap, not normal request flow.

- **The lockfile / installed dependency state is not trusted.**
  - The repo already drifted into a React/ReactDOM patch mismatch during normal work.
  - That means installs are not fully deterministic in practice.
  - The codebase is allowing version drift and operational surprises.

- **Build and generated artifacts are mixed into the repo like source.**
  - `.next`
  - `outputs`
  - `template-outputs`
  - `machine_specs`
  - `machine_specs_v2`
  - `results.csv`
  - `tsconfig.tsbuildinfo`
  - This is noise at best and build/tooling corruption at worst.

## 4. Medium Priority Issues

- **`updateJob()` is non-atomic and inefficient.**
  - `lib/db.ts`
  - Each field update becomes a separate `UPDATE`.
  - This causes unnecessary write amplification and possible partial state updates.

- **Polling and SSE are both active at once.**
  - `app/jobs/[id]/LiveUpdater.tsx`
  - Polling does not shut off when SSE is healthy.
  - This causes unnecessary traffic and duplicated state work.

- **`typeCheck()` is misleading.**
  - `lib/pipeline/renderer.ts`
  - It filters errors to lines containing `src/` and returns success otherwise.
  - That means the repo can be red while the function claims success.

- **Renderer command construction is brittle.**
  - `lib/pipeline/templateRenderer.ts`
  - `lib/pipeline/renderer.ts`
- Commands are built as shell strings.
- Props file paths are not safely quoted.

## 4A. Dependency Health (Critical Supporting Concern)

Dependency management is currently part of the instability, not a separate cleanup concern.

This repo already showed several dependency-health failures during normal development:
- `react` and `react-dom` drifted to different patch versions and caused runtime render instability
- `@remotion/google-fonts` introduced render-time network dependency problems
- a platform-specific package like `@esbuild/darwin-arm64` ended up in direct dependencies on Windows
- `package.json`, installed modules, and `package-lock.json` have not remained reliably in sync

That means dependency discipline is currently too weak for a production-grade rendering platform.

### Current dependency risks

- **React runtime mismatch risk**
  - `react` and `react-dom` must always be identical versions in this app
  - this repo already broke on that exact issue
  - rendering platforms are especially sensitive to React runtime mismatch because failures surface late and often only during render execution

- **Remotion package drift risk**
  - `remotion` and `@remotion/*` packages should be pinned exactly and upgraded together
  - allowing them to drift independently increases bundling and runtime risk

- **Platform-specific package contamination**
  - direct dependencies should not include OS-specific binaries unless absolutely required
  - packages like `@esbuild/darwin-arm64` should not be manually pinned in a cross-platform app dependency graph

- **Unused dependency sprawl**
  - dependencies like `open`, `mime-types`, and `git-filter-repo` appear suspicious and should be audited for actual usage
  - every unused direct dependency increases install surface, maintenance cost, and security exposure

- **Lockfile unreliability**
  - if the app regularly drifts into different installed versions than expected, the lockfile is not being treated as source of truth
  - that breaks reproducibility across machines and CI

- **Generated artifact pollution makes dependency issues harder to reason about**
  - when `.next`, generated TSX, and tsbuild artifacts are tracked or left dirty, it becomes harder to distinguish dependency breakage from generated noise

### What a healthy dependency policy should look like

- pin `react` and `react-dom` to the exact same version
- pin `remotion` and every `@remotion/*` package to the exact same version
- treat `package-lock.json` as part of the deploy contract
- use `npm ci` in CI and deployment
- avoid manually adding platform-specific binary packages
- audit direct dependencies regularly and remove anything unused
- separate runtime dependencies from local tooling and scripts cleanly

### Immediate dependency cleanup checklist

1. Align core runtime versions
- `react` = exact version
- `react-dom` = same exact version
- `remotion` = exact version
- all `@remotion/*` packages = same exact version

2. Clean the dependency graph
- remove platform-specific direct deps unless proven necessary
- remove unused direct dependencies
- move local-only tooling to `devDependencies` where appropriate

3. Rebuild trust in installs
- delete broken `node_modules`
- regenerate `package-lock.json` cleanly once
- ensure fresh install works on the target OS
- add CI install verification with `npm ci`

4. Add guardrails
- add a dependency check script
- fail CI if `react` and `react-dom` differ
- fail CI if `remotion` and `@remotion/*` versions drift
- fail CI if install modifies the lockfile unexpectedly

### Recommendation

Dependency stabilization should be treated as part of Phase 1 platform cleanup, not a later maintenance chore.

If the dependency layer remains loose:
- render failures will keep appearing as “random”
- local/dev/prod parity will keep drifting
- template debugging will stay slower than it should be
  - This is vulnerable to path and shell edge cases.

- **The creative layer is a monolith.**
  - `lib/templates/creativeEnhancer.ts`
  - 2291 lines
  - It mixes prompt strategy, palette logic, validation retries, template-specific overrides, mood selection, and scene patching.
  - This file is too large to reason about safely.

- **Template addition still has too much ceremony.**
  - `src/templates/templateDescriptors.ts`
  - `src/templates/index.ts`
  - manifests and schema are centralized, but component registration is still manual.
  - This is better than before, but not yet scalable as a template platform.

- **The app homepage still describes the old product path.**
  - `app/page.tsx`
  - It says the pipeline generates a motion spec, writes Remotion code, and renders the video.
  - That is not the preferred architecture anymore.
  - Product messaging is lagging behind architecture intent.

- **Strict TypeScript is undermined by config choices.**
  - `tsconfig.json`
  - `allowJs: true`
  - `skipLibCheck: true`
  - `include: ["**/*.ts", "**/*.tsx"]`
  - This is broad, permissive, and includes generated material.

- **Lint coverage is far too narrow.**
  - `package.json`
  - `lint` only runs `eslint src && tsc`
  - Most operational risk lives in `app`, `components`, and `lib`.

## 5. Low Priority Issues

- **README is template boilerplate, not project documentation.**
  - `README.md`

- **Railway deploy config is stale.**
  - `railway.json`
  - It still points to `phase1-restore`.

- **Package metadata is scaffold quality.**
  - `package.json`
  - Name and description do not describe the actual product.

- **Source still contains raw `console.log` / `console.warn` instrumentation.**
  - `lib/queue.ts`
  - `lib/templates/creativeEnhancer.ts`
  - `lib/templates/resolver.ts`
  - `src/Root.tsx`

- **`SpecViewer` uses `dangerouslySetInnerHTML`.**
  - `components/SpecViewer.tsx`
  - The current escaping helps, but this is still unnecessary risk when plain rendering would work.

## 6. Unnecessary / Removable Code

- **Unused direct dependencies**
  - `package.json`
  - `open`
  - `mime-types`
  - `git-filter-repo`
  - I found no app/lib/src/scripts usage for them in the inspected code.
  - They should be removed unless there is a hidden workflow depending on them.

- **Generated build artifacts tracked as source noise**
  - `.next/**`
  - `tsconfig.tsbuildinfo`
  - These should not be tracked.

- **App-adjacent experimental artifact folders**
  - `machine_specs`
  - `machine_specs_v2`
  - `outputs`
  - `template-outputs`
  - They should be moved into a dedicated artifact or research workspace outside the app surface.

- **Legacy generated source file in main source tree**
  - `src/GeneratedMotion.tsx`
  - This should not be a mutable source-of-truth file in the app tree.

- **Stale results and CSV files in repo root**
  - `results.csv`
  - `results_drive_ready_v1.csv`
  - These are operational artifacts, not application code.

## 7. Architecture Feedback

### What is good

- The project has clearly evolved toward a schema-driven template platform.
- `src/templates/templateDescriptors.ts` is a good move.
- Separating server-safe registry and client registry is correct.
- Structured template rendering is the only path here that can plausibly become production-grade.

### What is unhealthy

- The repo still mixes product code, experimental scripts, generated outputs, and runtime artifacts in one workspace.
- The legacy path is not a clean fallback. It is a second rendering architecture with lower safety guarantees.
- The system does not yet have a stable internal contract for:
  - backgrounds
  - style presets
  - typography
  - template capability metadata
  - fallback escalation

### Template system analysis

Current structure:
- schema + manifest + component per template
- shared manifest/schema registry
- explicit client component registry
- explicit server registry

This is decent, but not fully extensible.

Current reality:
- templates are modular at the file level
- templates are not plug-and-play at the system level
- core logic still needs editing to add a template

### Can new templates be added without modifying core logic?

Not fully.

Today, a new template still requires touching:
- `src/templates/templateDescriptors.ts`
- `src/templates/index.ts`
- possibly `lib/pipeline/intentAnalyzer.ts`
- often `lib/templates/creativeEnhancer.ts`

So the system has a registry pattern, but not a true plugin architecture.

### How template scaling should happen next

Do **not** scale by just adding more folders under `src/templates`.

That is how the system becomes wide but unreliable.

The next stage should be **lane-based scaling**:

1. Stabilize one template lane at a time
- Lane 1: data / infographic
  - `bar-chart`
  - `line-chart`
  - `pie-chart`
  - `grouped-bar-comparison`
  - `stacked-bar-breakdown`
  - `updating-bar-chart`
  - `stat-counter`
- Lane 2: text / title motion
- Lane 3: explainer / product showcase
- Lane 4: cinematic / transitions

2. Define a template maturity checklist
- Every new template should not be considered "done" until it passes:
  - schema validation
  - registry wiring
  - analyzer routing
  - creativeEnhancer compatibility
  - portrait and landscape render checks
  - dark and light background checks
  - multi-scene compatibility if applicable
  - TypeScript clean build

3. Create a canonical template contract
- Every template should declare:
  - supported aspect ratios
  - supported background types
  - whether it supports `stylePreset`
  - whether it supports `typography`
  - whether it supports `motionStyle`
  - whether it supports `effects`
  - whether it is safe for composite scenes
  - sample prompts for smoke tests

4. Add template generation scaffolding
- Build a small internal generator like:
  - `npm run new:template <template-id>`
- It should generate:
  - component file
  - schema
  - manifest
  - descriptor registration
  - test prompt stub
  - visual QA checklist stub

5. Separate shared primitives from template code
- Right now chart templates already depend on shared helpers like:
  - `ChartScaffold.tsx`
  - `chartShared.ts`
- This is good and should be expanded.
- Future lanes should also have shared primitives:
  - text-scene scaffold
  - comparison scaffold
  - metric scaffold
  - cinematic transition primitives

6. Stop baking routing logic directly into giant prompt tables
- Template routing should gradually move to metadata-driven capability matching.
- Example:
  - template tags
  - category
  - required data shape
  - multi-series support
  - supports time-series
  - supports proportions
- This will make adding templates safer than manually patching huge prompt text.

7. Add a golden prompt suite per template
- One repository folder should hold:
  - `prompts/golden/<template-id>.json`
- Every template addition must come with:
  - 1 happy-path prompt
  - 1 edge-case prompt
  - expected pipeline mode
  - expected template ID

### Recommended scaling model

The best next scaling model is:
- **registry-driven**
- **capability-declared**
- **scaffold-assisted**
- **QA-gated**

Not:
- manually copy a template folder
- manually patch analyzer text
- manually patch backgrounds later
- manually discover breakage in render logs

That current approach does not scale.

### Recommended template architecture direction

Move toward a real template platform:

1. `template.json` or `manifest.ts`
- declare schema import path
- declare component import path
- declare tags, compatible animations, aspect support, background support

2. Shared registration generator
- generate both server and client registries from the same manifest list

3. Capability-driven routing
- analyzer should consume capability metadata instead of giant hand-maintained prompt tables

4. Template health contract
- each template must declare:
  - allowed backgrounds
  - aspect-ratio support
  - composition type
  - optional stylePreset/effects support
  - test samples

### Project direction and design health

The project is moving in the right conceptual direction, but execution is uneven.

You are building:
- a reusable template system in one hand
- a brittle emergency codegen machine in the other

That is the core tension.

My recommendation:
- double down on the template platform
- isolate or kill the legacy codegen path
- stop adding breadth until the shared layer is stable

### AI fallback system analysis

Current fallback behavior:
- template pipeline attempts first
- if it declines or errors, the system falls back into the legacy path
- that legacy path expands prompt -> generates sparse spec -> generates JSX -> writes source -> renders

This is not a clean fallback.

This is a second architecture.

That is why fallback currently increases instability instead of protecting the system.

### What should happen when a requested template does not exist

Right now:
- unknown template or invalid params generally collapse to legacy rendering

That is too broad.

A better fallback policy is:

1. **If a close structured template exists**
- map to nearest supported template
- example:
  - unsupported radar chart -> fallback to grouped comparison or line chart only if semantically close

2. **If no close structured template exists**
- route to a constrained AI fallback layer
- but the fallback must return a **validated intermediate contract**, not raw JSX

3. **If the fallback cannot produce valid structured output**
- fail gracefully with a user-facing explanation
- do not silently descend into arbitrary source mutation

### Hera AI fallback recommendation

If you want to replace the current legacy fallback with a Hera AI API, that is a good strategic move **only if** you use it as a structured fallback service, not as a freeform code generator.

Recommended design:

#### Trigger conditions

Hera fallback should trigger only when:
- requested template ID is unknown
- analyzer confidence is medium/high but params fail validation repeatedly
- prompt clearly asks for a supported category but no existing template can express it
- multi-scene decomposition fails, but scene intent is still recoverable

Hera should **not** trigger for:
- low-confidence garbage prompts
- auth/rate-limit failures
- render infrastructure failures
- missing environment/config

#### Input contract to Hera

Send Hera:
- original prompt
- normalized aspect ratio
- requested duration
- list of supported template IDs
- template capability metadata
- background/style capability metadata
- fallback mode requested:
  - `nearest-template`
  - `generic-scene`
  - `multi-scene-generic`

#### Output contract from Hera

Hera should return one of these:

1. `nearest_template`
```json
{
  "mode": "nearest_template",
  "templateId": "bar-chart",
  "params": {}
}
```

2. `generic_scene`
```json
{
  "mode": "generic_scene",
  "sceneType": "data-card" | "title-card" | "comparison" | "metric" | "timeline" | "quote",
  "params": {}
}
```

3. `multi_scene_generic`
```json
{
  "mode": "multi_scene_generic",
  "scenes": []
}
```

Hera should **not** return:
- TSX
- JSX
- executable code
- arbitrary CSS blobs
- direct Remotion source

#### Safety and validation layer

Every Hera response must be validated by:
- a Zod schema for the fallback response itself
- then a mapper into:
  - an existing template
  - or a very small set of approved generic fallback compositions

If validation fails:
- abort fallback
- mark job as failed with explicit explanation

#### Consistency rules

To avoid output chaos:
- Hera fallback must use the same `BackgroundSchema`
- same `StylePresetSchema`
- same `TypographySchema`
- same `MotionStyleSchema`
- same `EffectsSchema`

That way fallback outputs still feel native to the system.

### Best practical fallback redesign

The strongest design is:

1. Remove production reliance on raw-code legacy fallback
2. Add Hera fallback as a **structured scene planner**
3. Map Hera output into:
  - existing templates
  - or 3-5 generic safe templates:
    - `generic-title`
    - `generic-stat`
    - `generic-comparison`
    - `generic-list`
    - `generic-data-scene`

This keeps consistency, safety, and render determinism.

### Long-term fallback strategy

The fallback architecture should become:

- Primary:
  - template routing
- Secondary:
  - Hera structured fallback
- Tertiary:
  - graceful failure

Not:
- Primary template path
- panic fallback into raw AI-generated code

## 8. Performance & Security Issues

### Performance

- `LiveUpdater.tsx` does polling and SSE simultaneously.
- `updateJob()` does many small writes instead of one atomic update.
- `creativeEnhancer.ts` is large and likely expensive to execute and maintain.
- Generated artifacts remain on disk and in source space.
- Docker build is slow and heavyweight:
  - single-stage
  - `npm install` instead of `npm ci`
  - no `.dockerignore`

### Security

- No auth or ownership model on job APIs.
- `/api/assets` can sign arbitrary object keys.
- No rate limiting on render creation or preview.
- Remote AI usage has no guardrails for abuse volume.
- Chromium web security is disabled globally for rendering.
- Secrets are accessed ad hoc with non-null assertions in `lib/r2.ts`.

## 9. Refactoring Plan (Step-by-step)

1. **Make the repo safe before making it elegant**
- Add auth to all job and asset endpoints.
- Add per-user ownership to jobs and asset keys.
- Add rate limiting for job creation and preview.

2. **Stop the build from lying**
- Make `tsc --noEmit` pass.
- Expand lint to `app`, `components`, `lib`, `src`, `scripts` as appropriate.
- Exclude generated folders from TS compile.

3. **Stop runtime source mutation**
- Remove `src/GeneratedMotion.tsx` from the execution model.
- If legacy must remain temporarily, write into a temp workspace outside app source.

4. **Replace the in-memory queue**
- Move to a durable worker model:
  - Postgres-backed worker table
  - or Redis-backed queue
  - or dedicated worker service

5. **Stabilize the template platform**
- Unify background support end-to-end.
- Generate client/server registries from one source.
- Add template capability metadata.

6. **Redesign fallback behavior**
- Do not fall back straight into raw JSX generation from production traffic.
- Add a constrained AI fallback layer that returns a normalized scene contract instead.

7. **Break up the creative layer**
- split `creativeEnhancer.ts` into:
  - palette selection
  - prompt overrides
  - contrast enforcement
  - multi-scene enhancement
  - template-specific patchers

8. **Fix aspect-ratio contract**
- Unify allowed aspect ratios across:
  - form
  - API normalization
  - renderer
  - template layouts

9. **Clean repo hygiene**
- remove tracked `.next`
- remove tracked `tsconfig.tsbuildinfo`
- move outputs and research artifacts out of core repo surface

10. **Then add more templates**
- not before

## 10. Production Readiness Checklist

Current status: **Not production-ready**

- Authentication: No
- Authorization: No
- Durable queue: No
- Deterministic install hygiene: Weak
- Structured logging: No
- Rate limiting: No
- Monitoring / alerting: No
- Startup env validation: No
- Real migrations: No
- Green typecheck gate: No
- Artifact isolation: No
- Secure asset access model: No
- Current docs accurate: No

## 11. Testing Strategy

Current status: effectively no meaningful automated safety net.

Recommended minimum:

- Unit tests
  - `resolveTemplate()`
  - `resolveMultiScene()`
  - `normalizeAnimation()`
  - background schema validation
  - style preset resolution

- Integration tests
  - `POST /api/jobs`
  - `GET /api/jobs/[id]`
  - `GET /api/jobs/[id]/stream`
  - `GET /api/assets`
  - preview flow

- Template contract tests
  - every template schema parses its defaults
  - every manifest ID matches registry
  - every template supports declared aspect ratios

- Snapshot / visual tests
  - one golden prompt per template
  - dark and light background variants
  - portrait and landscape where applicable

- Fallback tests
  - unknown template
  - invalid params
  - medium confidence
  - AI malformed output

- Render pipeline tests
  - template render success
  - R2 upload success
  - failed render state transition

## 12. Before vs After Fixes

### A. Job updates

Before:

```ts
for (const [key, value] of entries) {
  await sql`UPDATE jobs SET ... WHERE id = ${id}`;
}
```

After:

```ts
await sql`
  UPDATE jobs
  SET
    status = COALESCE(${fields.status}, status),
    step = COALESCE(${fields.step}, step),
    error = COALESCE(${fields.error}, error),
    updated_at = now()
  WHERE id = ${id}
`;
```

### B. Template fallback

Before:

```ts
const resolution = resolveTemplate(intent);
if (resolution.mode === "legacy") {
  return false;
}
```

After:

```ts
const resolution = resolveTemplate(intent);
if (resolution.mode === "template") {
  return resolution;
}

const fallbackScene = await generateGenericScene(intent);
const validated = GenericSceneSchema.safeParse(fallbackScene);
if (!validated.success) {
  throw new Error("No safe fallback available");
}

return mapGenericSceneToSafeTemplate(validated.data);
```

### C. Background support

Before:
- schema supports `dots`, `grid`, `radial-glow`
- renderer does not

After:
- one canonical `BackgroundSchema`
- one `Background.tsx` that renders every declared type
- one analyzer vocabulary that only outputs supported shapes

### D. Rendering process

Before:

```ts
fs.writeFileSync("src/GeneratedMotion.tsx", fullComponent);
execSync("npx remotion render ...");
```

After:

```ts
const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "render-"));
const entryFile = path.join(tempDir, "GeneratedMotion.tsx");
await fs.promises.writeFile(entryFile, fullComponent, "utf-8");
await spawnRemotionRender(entryFile, outputFile, props);
```

## 13. Final Verdict (Brutally Honest)

This codebase is not production-grade today.

It is a strong, ambitious prototype with the beginnings of a real platform inside it.

The strongest part of the system is the template direction.
The weakest part is the operational and architectural discipline around it.

What you have now:
- impressive template breadth
- clear product potential
- good movement toward schemas and structured outputs

What is still wrong:
- no auth
- no durable queue
- runtime source mutation
- red typecheck
- partial shared-system parity
- stale docs and deploy config
- build artifacts mixed into repo state
- unsafe legacy fallback being treated like a normal production path

If you keep adding templates without stabilizing the platform, the system will get harder and harder to trust.

If you pause expansion and spend a serious iteration cycle on:
- platform cleanup
- queue durability
- type safety
- background/style unification
- fallback redesign

then this can become a strong internal platform and eventually a real product.

The strategic recommendation is simple:

- **Do not scale template count first**
- **Scale system quality first**

That is the difference between a demo engine and a production motion-graphics platform.

## 14. Execution Plan (Phase-by-Phase)

This section turns the audit into a practical build plan.

The key rule:
- do not keep mixing platform fixes, template additions, fallback redesign, and repo cleanup in the same iteration
- each phase should have a clear goal and a clear exit bar

### Phase 1: Stabilize the chart and infographic lane

Scope:
- `bar-chart`
- `line-chart`
- `pie-chart`
- `grouped-bar-comparison`
- `stacked-bar-breakdown`
- `updating-bar-chart`
- `stat-counter`

Why this phase first:
- this is already your strongest product lane
- it is the lane most affected by the recent migration work
- it exposes the shared primitive weaknesses very clearly

What to do:
- finish background parity between schema, analyzer vocabulary, and renderer
- fix layout bugs like pie-chart misalignment and chart spacing drift
- make color, typography, and motion behavior consistent across all chart templates
- define one shared chart design contract for legends, labels, title spacing, grid lines, and safe paddings
- make prompt routing reliable for chart prompts without dropping to legacy unnecessarily

Deliverables:
- one canonical chart QA checklist
- one golden test prompt set for each chart template
- one screenshot/video reference set for expected outputs
- all chart templates render correctly in landscape, portrait, and square where intended

Exit criteria:
- all chart prompts route to the right template consistently
- no chart template depends on unsupported background types
- no obvious visual misalignment in chart titles, legends, axes, or labels
- no render failures caused by fonts or React/runtime drift

What not to do in this phase:
- do not add more chart types yet
- do not redesign the whole fallback system yet
- do not mix unrelated repo cleanup into chart stabilization commits

### Phase 2: Unify shared primitives and visual contracts

Goal:
- make the platform underneath templates consistent and predictable

What to do:
- create one canonical `BackgroundSchema`
- make `Background.tsx` render every declared background type
- unify style preset handling across templates
- unify typography decisions so templates do not each improvise font stacks, spacing, and emphasis logic
- audit `effects`, motion presets, and layout helpers for drift
- reduce duplicate styling logic inside templates by extracting shared helpers

Main modules:
- `src/primitives/Background.tsx`
- `src/primitives/useStylePreset.ts`
- `src/primitives/useTypography.ts`
- `src/templates/types.ts`
- `src/templates/chartShared.ts`
- `src/templates/ChartScaffold.tsx`

Deliverables:
- documented visual system contract
- shared helper coverage for common layout patterns
- removal of duplicated background and style logic across templates

Exit criteria:
- every declared visual option is actually renderable
- shared types match shared renderers
- adding a template no longer requires inventing one-off visual rules

### Phase 3: Replace legacy fallback with Hera structured fallback

This is the most important architectural redesign after queue durability.

Current problem:
- the legacy fallback is effectively raw code generation plus runtime source mutation
- it is operationally risky, hard to validate, and hostile to scale

What Hera should be used for:
- structured planning
- generic scene synthesis
- layout intent extraction
- fallback template suggestion

What Hera should not be used for:
- directly generating arbitrary JSX that gets treated as trusted runtime source
- bypassing schema validation
- producing outputs that ignore your visual system

Recommended Hera fallback flow:

1. Template resolution tries normal registry-based matching first.
2. If no supported template is found, send normalized intent to Hera.
3. Hera returns a structured fallback contract, not code.
4. Validate that contract with Zod.
5. Map it into:
   - a safe generic scene template
   - or a multi-scene composition made only from approved building blocks
6. Render only after validation succeeds.

Suggested fallback contract:

```ts
type HeraFallbackResult = {
  lane: "text" | "data" | "comparison" | "showcase" | "broadcast";
  compositionType: "single-scene" | "multi-scene";
  title?: string;
  subtitle?: string;
  styleHints?: {
    tone?: string;
    palette?: string;
    background?: "solid" | "gradient" | "grain" | "stripe" | "dots" | "grid" | "radial-glow";
  };
  scenes: Array<{
    templateClass: string;
    content: Record<string, unknown>;
    durationWeight?: number;
  }>;
  confidence: number;
};
```

Fallback trigger rules:
- no template matches with high enough confidence
- requested concept is supported in spirit but not by exact template
- template validation fails but intent can still be mapped safely

Fallback should not trigger when:
- input is invalid
- prompt is unsafe
- the requested output contradicts system constraints
- there is a render/runtime failure unrelated to template choice

Safety layer:
- validate Hera output with strict schema
- normalize only into approved primitives/templates
- reject anything that exceeds supported composition rules
- never let fallback bypass aspect-ratio constraints, typography contracts, or animation contracts

Exit criteria:
- no runtime source mutation
- no `GeneratedMotion.tsx` writes during fallback
- fallback outputs are structurally consistent with the rest of the platform

### Phase 4: Hardening the runtime and infrastructure

Goal:
- make the platform safe to deploy and operate

What to do:
- add authentication and per-user authorization
- add rate limiting to expensive endpoints
- replace in-memory queue with durable job infrastructure
- make `updateJob()` atomic
- add proper DB indexes
- validate env vars at startup
- stop request-time schema creation
- introduce structured logs and monitoring hooks

Priority files:
- `app/api/jobs/route.ts`
- `app/api/jobs/[id]/route.ts`
- `app/api/assets/route.ts`
- `lib/db.ts`
- `lib/queue.ts`
- `lib/r2.ts`

Exit criteria:
- jobs survive process restarts
- multiple instances can process safely
- unauthorized users cannot create or read arbitrary jobs/assets
- failures are observable and actionable

### Phase 5: Template scaling system

Only start this phase after Phases 1 to 4 are mostly stable.

Goal:
- make template expansion disciplined instead of chaotic

What to build:
- one template scaffold generator
- one registry-driven template descriptor format
- one capability model that tags templates by lane, aspect ratios, density, and content type
- one validation checklist for new templates
- one golden prompt suite per lane

Recommended template metadata:

```ts
type TemplateCapability = {
  id: string;
  lane: "text" | "data" | "comparison" | "showcase" | "broadcast" | "cinematic";
  supportedAspectRatios: Array<"16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "4:5">;
  contentKinds: string[];
  complexity: "simple" | "moderate" | "advanced";
  fallbackEligible: boolean;
};
```

How to add templates going forward:
- create from scaffold
- register through descriptor only
- inherit shared primitives by default
- add prompt-routing examples
- add render snapshots
- add golden prompts
- verify lane-specific QA checklist

What to avoid:
- hand-copying folders from another repo without parity checks
- adding templates before shared primitives support them
- embedding special-case analyzer logic for one template unless it generalizes cleanly

### Phase 6: Product refinement and lane expansion

Once the platform is stable, expand by lane instead of random template count.

Recommended lane order:
1. Data / infographic
2. Explainer / comparison
3. Text / title motion
4. Broadcast / social UI
5. Showcase / product promos
6. Cinematic / transitions

Why this order:
- it matches your strongest current coverage
- it reduces design drift
- it makes QA and product packaging easier

### Immediate Next 30 Days

If the team wants a practical sequence, this is the highest-leverage order:

Week 1:
- make `tsc` green
- stop render-time Google font dependency
- fix React / dependency consistency
- stabilize chart template routing

Week 2:
- finish background parity
- fix chart/pie/legend/layout misalignment issues
- define and document shared chart visual rules

Week 3:
- remove runtime source mutation from fallback path
- design Hera structured fallback contract
- build generic safe fallback scene path

Week 4:
- add auth, rate limiting, and asset access controls
- start replacing in-memory queue assumptions
- add structured logging and env validation

### Final strategic call

The right move is not:
- add 20 more templates quickly
- patch issues as they appear
- keep freeform codegen alive because it feels flexible

The right move is:
- stabilize one lane
- unify the platform
- replace unsafe fallback
- then scale template count on top of that stable base

That is how this becomes a real motion-graphics system instead of a growing pile of clever exceptions.
