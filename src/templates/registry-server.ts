/**
 * Server-safe template registry — schemas and manifests only, NO React components.
 * Use this in lib/ code (API routes, pipeline) to avoid pulling Remotion into the Next.js server bundle.
 */
import type { z } from "zod";
import type { TemplateManifest } from "./types";
import { TEMPLATE_DESCRIPTORS, getTemplateIdsFromDescriptors } from "./templateDescriptors";

export interface ServerTemplateEntry {
  id: string;
  schema: z.ZodType;
  manifest: TemplateManifest;
}

export const SERVER_TEMPLATE_REGISTRY: Record<string, ServerTemplateEntry> = Object.fromEntries(
  TEMPLATE_DESCRIPTORS.map((d) => [
    d.id,
    { id: d.id, schema: d.schema, manifest: d.manifest } satisfies ServerTemplateEntry,
  ])
) as Record<string, ServerTemplateEntry>;

if (process.env.NODE_ENV !== "production") {
  const descriptorIds = getTemplateIdsFromDescriptors().sort();
  const registryIds = Object.keys(SERVER_TEMPLATE_REGISTRY).sort();
  if (descriptorIds.join("|") !== registryIds.join("|")) {
    console.error(
      "[templates] Server registry drift detected. Missing/extra ids:",
      { descriptorIds, registryIds },
    );
  }
}

export function getTemplateIds(): string[] {
  return Object.keys(SERVER_TEMPLATE_REGISTRY);
}

export function getTemplateDescriptions(): string {
  return TEMPLATE_DESCRIPTORS.map((d) => {
    const m = d.manifest;
    return (
      "- " +
      m.id +
      ": " +
      m.description +
      " [tags: " +
      m.tags.join(", ") +
      "]" +
      " [animations: " +
      m.compatibleAnimations.join(", ") +
      "]" +
      " [duration: " +
      m.minDuration +
      "-" +
      m.maxDuration +
      "s]"
    );
  }).join("\n");
}
