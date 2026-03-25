import { SERVER_TEMPLATE_REGISTRY as TEMPLATE_REGISTRY } from "../../src/templates/registry-server";
import { normalizeAnimation } from "./animationFallback";

export interface TemplateResolution {
  mode: "template" | "legacy";
  templateId?: string;
  params?: Record<string, unknown>;
  error?: string;
}

export interface IntentResult {
  templateId: string;
  params: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  aspect_ratio?: string;
}

/**
 * Validates the LLM intent result against the template's Zod schema.
 * Returns a TemplateResolution indicating whether to use the template path or fall back.
 */
export function resolveTemplate(intent: IntentResult): TemplateResolution {
  // Only explicit high-confidence matches are allowed onto the deterministic
  // template path. Medium / low confidence should fall through to fallback.
  if (intent.confidence !== "high") {
    return {
      mode: "legacy",
      error:
        intent.confidence.charAt(0).toUpperCase() +
        intent.confidence.slice(1) +
        " confidence: " +
        intent.reasoning,
    };
  }

  const entry = TEMPLATE_REGISTRY[intent.templateId];
  if (!entry) {
    return { mode: "legacy", error: "Unknown template: " + intent.templateId };
  }

  // Normalize animation before validation so out-of-vocabulary terms don't cause fallback
  if (typeof intent.params.entranceAnimation === "string") {
    const norm = normalizeAnimation(intent.templateId, intent.params.entranceAnimation);
    if (norm.wasNormalized) {
      console.log(
        "[resolver] Normalized animation:",
        intent.params.entranceAnimation, "→", norm.animation,
        "for template", intent.templateId
      );
      intent.params.entranceAnimation = norm.animation;
    }
  }

  // Validate params against template's Zod schema
  const result = entry.schema.safeParse(intent.params);
  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => i.path.join(".") + ": " + i.message
    );
    return { mode: "legacy", error: "Param validation failed: " + errors.join("; ") };
  }

  return {
    mode: "template",
    templateId: intent.templateId,
    params: result.data as Record<string, unknown>,
  };
}

/**
 * Returns validation errors for a set of params against a template schema.
 * Used to provide error feedback to the LLM for retry.
 */
export function validateTemplateParams(
  templateId: string,
  params: Record<string, unknown>
): string[] {
  const entry = TEMPLATE_REGISTRY[templateId];
  if (!entry) return ["Unknown template: " + templateId];

  const result = entry.schema.safeParse(params);
  if (result.success) return [];

  return result.error.issues.map(
    (i) => i.path.join(".") + ": " + i.message
  );
}
