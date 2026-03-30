import fs from "fs";
import path from "path";
import {
  analyzeIntent,
  isMultiSceneResult,
} from "../lib/pipeline/intentAnalyzer";
import { resolveTemplate } from "../lib/templates/resolver";

type PromptEntry = {
  id: string;
  prompt: string;
  expectedTemplateId?: string;
  coverage?: string;
};

type LocationSummary = {
  label: string;
  placeCanonical: string | null;
  placeKind: string | null;
  placeRegion: string | null;
};

const promptFile = process.argv[2];

if (!promptFile) {
  console.error("Usage: npm exec --yes tsx scripts/qaMapIntentAudit.ts <prompt-file>");
  process.exit(1);
}

const absolutePromptFile = path.resolve(process.cwd(), promptFile);

if (!fs.existsSync(absolutePromptFile)) {
  console.error(`Prompt file not found: ${absolutePromptFile}`);
  process.exit(1);
}

const prompts = JSON.parse(
  fs.readFileSync(absolutePromptFile, "utf8"),
) as PromptEntry[];

async function main() {
  for (const entry of prompts) {
    let intent;
    try {
      intent = await analyzeIntent(entry.prompt);
    } catch (error) {
      console.log(
        JSON.stringify(
          {
            id: entry.id,
            coverage: entry.coverage ?? null,
            expectedTemplateId: entry.expectedTemplateId ?? null,
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ),
      );
      continue;
    }

    if (isMultiSceneResult(intent)) {
      console.log(
        JSON.stringify(
          {
            id: entry.id,
            coverage: entry.coverage ?? null,
            expectedTemplateId: entry.expectedTemplateId ?? null,
            mode: "multi-scene",
          },
          null,
          2,
        ),
      );
      continue;
    }

    const resolution = resolveTemplate(intent);
    const resolvedLocations =
      resolution.mode === "template" && Array.isArray(resolution.params?.locations)
        ? (resolution.params.locations as Array<Record<string, unknown>>).map(
            (location): LocationSummary => ({
              label: String(location.label ?? ""),
              placeCanonical:
                typeof location.placeCanonical === "string"
                  ? location.placeCanonical
                  : null,
              placeKind:
                typeof location.placeKind === "string"
                  ? location.placeKind
                  : null,
              placeRegion:
                typeof location.placeRegion === "string"
                  ? location.placeRegion
                  : null,
            }),
          )
        : [];

    console.log(
      JSON.stringify(
        {
          id: entry.id,
          coverage: entry.coverage ?? null,
          expectedTemplateId: entry.expectedTemplateId ?? null,
          templateId: intent.templateId,
          confidence: intent.confidence,
          resolutionMode: resolution.mode,
          locations: resolvedLocations,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
