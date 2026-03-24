# Codebase Index (shape-motion-lab)

## What this repo is

Shape Motion Lab is a **Next.js (App Router) web app** + **Remotion renderer** that turns a user prompt into a rendered MP4:

- **Preview path**: prompt → intent analysis → template selection + params (no render)
- **Render job path**: prompt → (template pipeline or legacy pipeline) → render via Remotion → upload artifacts to R2 → job status stored in Neon

Primary entrypoints:

- Next.js app: `app/layout.tsx`, `app/page.tsx`
- Next.js API: `app/api/**/route.ts`
- Remotion root: `src/index.ts`, `src/Root.tsx`

## Commands

- Dev server: `npm run dev` (Next.js)
- Remotion Studio: `npm run dev:remotion`
- Render (CLI): `npx remotion render`
- Lint + typecheck: `npm run lint`
- Template render helper: `npm run render:template`

## Directory map (high-signal)

- `app/` — Next.js App Router pages + API routes
  - `app/page.tsx` — homepage; lists recent jobs from Neon
  - `app/jobs/[id]/page.tsx` — job detail page
  - `app/api/jobs/route.ts` — create/list jobs; enqueues render jobs
  - `app/api/jobs/[id]/route.ts` — fetch a single job
  - `app/api/jobs/[id]/stream/route.ts` — **SSE** stream for live job progress
  - `app/api/preview/route.ts` — prompt → intent/template resolution (no render)
  - `app/api/assets/route.ts` — redirects to R2 presigned URL for an asset key
- `components/` — UI components (client-side pieces for the Next app)
  - `components/HomeClient.tsx` — main UI orchestration for prompt submission + job list
  - `components/RemotionTemplatePreview.tsx` — client preview surface for template params
- `lib/` — server-side logic (DB, queue, pipelines, template resolution)
  - `lib/db.ts` — Neon DB access + `jobs` table init/migrations
  - `lib/queue.ts` — in-memory **serial** job queue + SSE broadcaster; runs the pipeline
  - `lib/r2.ts` — Cloudflare R2 (S3-compatible) upload + presigned download URLs
  - `lib/pipeline/` — “legacy” prompt→spec→code→render pipeline pieces
    - `lib/pipeline/promptExpander.ts` — expands user prompt (OpenAI)
    - `lib/pipeline/specGenerator.ts` — generates Motion Spec JSON (OpenAI)
    - `lib/pipeline/codeGenerator.ts` — generates Remotion/React code (OpenAI)
    - `lib/pipeline/renderer.ts` — writes `src/GeneratedMotion.tsx`, renders MP4, uploads artifacts
    - `lib/pipeline/templateRenderer.ts` — renders template-based compositions (single/multi scene)
    - `lib/pipeline/intentAnalyzer.ts` — intent → template choice / multi-scene plan (OpenAI)
  - `lib/templates/` — template resolver + creative constraints layer (OpenAI-assisted)
  - `lib/types.ts` — shared `Job`, `SSEEvent`, step label constants
- `src/` — Remotion compositions, templates, and rendering primitives
  - `src/index.ts` — `registerRoot(RemotionRoot)`
  - `src/Root.tsx` — defines Remotion compositions:
    - `GeneratedMotion` (legacy pipeline output)
    - `TemplateScene` (single template)
    - `SceneSequence` (multi-scene sequencing)
  - `src/GeneratedMotion.tsx` — **generated** file written by the pipeline; avoid manual edits
  - `src/templates/` — template library (React components + zod schemas + manifests)
  - `src/primitives/` — shared visual primitives/hooks (backgrounds, typography, effects)
  - `src/assets/` — built-in SVG assets + manifest/registry
- `scripts/` — local utilities and evaluation helpers (some call OpenAI directly)
- `outputs/` — local render artifacts (generated code / videos) during/after runs
- `template-outputs/` — saved example specs/props for template testing
- `docs/` — notes/articles

## Key runtime flows

### 1) Preview (no rendering)

`POST /api/preview` (`app/api/preview/route.ts`)

1. `lib/pipeline/intentAnalyzer.ts`: prompt → intent (template vs multi-scene)
2. `lib/templates/creativeEnhancer.ts`: apply style tokens → constrained template params
3. Resolve:
   - Single: `lib/templates/resolver.ts`
   - Multi: `lib/templates/multiSceneResolver.ts`
4. Returns `{ mode: "single" | "multi" | "legacy", ... }` to power the UI preview.

### 2) Render jobs (queue + SSE)

`POST /api/jobs` (`app/api/jobs/route.ts`) creates a row in Neon and calls `enqueueJob(job.id)`.

Processing happens inside `lib/queue.ts`:

- Template path first: intent → resolver → render via `lib/pipeline/templateRenderer.ts`
- Fallback legacy path: expand → spec → code → render via `lib/pipeline/renderer.ts`

Live updates:

- `GET /api/jobs/:id/stream` (`app/api/jobs/[id]/stream/route.ts`) subscribes to queue events (SSE).

## External services / env vars

- `OPENAI_API_KEY` — OpenAI SDK (pipeline + creative enhancer + scripts)
- `NEON_DATABASE_URL` — Neon Postgres connection string
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` — Cloudflare R2 (S3 API)
- Remotion sizing:
  - `REMOTION_APP_DURATION_FRAMES`
  - `REMOTION_APP_VIDEO_WIDTH`
  - `REMOTION_APP_VIDEO_HEIGHT`

## Notable config

- `remotion.config.ts` — Tailwind integration + render flags (OpenGL renderer, overwrite outputs)
- `next.config.ts` — `serverExternalPackages` for `openai` and Neon serverless client
- `eslint.config.mjs`, `tsconfig.json` — lint/typecheck
- `railway.json`, `Dockerfile` — deployment-related configuration

