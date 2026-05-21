import type { AIProvider, GeneratedActivationPlan, GeneratedAnalysis } from "./types";

const AI_KEYWORDS = ["ai", "agent", "workflow", "automation", "model", "gpt", "langgraph"];
const PRODUCT_KEYWORDS = ["product", "prototype", "market", "design", "system", "tool"];
const LOW_SIGNAL_KEYWORDS = ["screenshot", "small visual note", "without reusable context"];

export function createMockAIProvider(): AIProvider {
  return {
    async analyzeResource({ resource }) {
      const text = `${resource.title} ${resource.content ?? ""}`.toLowerCase();
      const aiMatches = AI_KEYWORDS.filter((keyword) => text.includes(keyword));
      const productMatches = PRODUCT_KEYWORDS.filter((keyword) => text.includes(keyword));
      const lowSignal = LOW_SIGNAL_KEYWORDS.some((keyword) => text.includes(keyword));
      const valueScore = lowSignal ? 35 : Math.min(95, 55 + aiMatches.length * 10 + productMatches.length * 7);
      const tags = [...new Set([...aiMatches.map(() => "ai"), ...productMatches.map(() => "product")])];

      return {
        summary: buildSummary(resource.title, resource.content),
        tags: tags.length > 0 ? tags : ["inbox"],
        valueScore,
        recommendation: valueScore >= 70 ? "activate" : valueScore >= 50 ? "review" : "archive",
        activationOpportunities: buildOpportunities(resource.title, valueScore),
        gaps: buildGaps(valueScore),
        reasoning:
          valueScore >= 70
            ? "The resource contains reusable concepts that can become a concrete internal plan."
            : "The resource is preserved for traceability, but it lacks enough actionable context right now."
      } satisfies GeneratedAnalysis;
    },
    async planActivation({ intent, resources, analyses }) {
      const topTags = [...new Set(analyses.flatMap((analysis) => analysis.tags))].slice(0, 3);
      const title = intent.trim() || `Activate ${resources[0]?.title ?? "saved resources"}`;
      return {
        title,
        tasks: [
          {
            id: "task_1",
            title: "Define the activation outcome",
            description: "Turn the selected resource signal into one measurable result inside this workspace.",
            priority: "high",
            permissionScope: "internal",
            status: "todo"
          },
          {
            id: "task_2",
            title: "Group supporting resources",
            description: `Build an internal collection from related tags: ${topTags.join(", ") || "inbox"}.`,
            priority: "medium",
            permissionScope: "internal",
            status: "todo"
          },
          {
            id: "task_3",
            title: "Create the first practical step",
            description: "Write a small next action that can be completed and reviewed without external automation.",
            priority: "high",
            permissionScope: "internal",
            status: "todo"
          }
        ],
        checkpoints: [
          "The user can explain why this resource matters.",
          "At least one station-internal task has been completed."
        ],
        gaps: [
          "Validate whether the selected resources are complete enough for the stated goal.",
          "Add missing examples or references before relying on this plan."
        ]
      } satisfies GeneratedActivationPlan;
    }
  };
}

function buildSummary(title: string, content?: string) {
  const cleaned = content?.trim();
  if (!cleaned) return `${title} is preserved as a resource that still needs more context before activation.`;
  const firstSentence = cleaned.split(/[.!?。！？]/)[0]?.trim() || cleaned.slice(0, 120);
  return `${title}: ${firstSentence}.`;
}

function buildOpportunities(title: string, valueScore: number) {
  if (valueScore < 50) {
    return [
      {
        mode: "review-driven" as const,
        title: "Archive or enrich",
        action: `Keep "${title}" traceable, then add context before turning it into a goal.`,
        confidence: 0.52
      }
    ];
  }
  return [
    {
      mode: "resource-driven" as const,
      title: "Convert into an activation goal",
      action: `Use "${title}" as the seed for a concrete station-internal action plan.`,
      confidence: valueScore >= 70 ? 0.88 : 0.68
    }
  ];
}

function buildGaps(valueScore: number) {
  return valueScore >= 70
    ? ["Missing success criteria", "Missing examples from the user's own context"]
    : ["Missing reusable details", "Missing a clear goal or next action"];
}
