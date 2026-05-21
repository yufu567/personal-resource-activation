import type {
  AIProvider,
  GeneratedActivationPlan,
  GeneratedBasicAnalysis,
  GeneratedReviewAdvice,
  GeneratedValueAssessment
} from "./types";
import type { AnalysisCategory, Resource, ResourceActualValue } from "@/core/types";

const AI_KEYWORDS = ["ai", "agent", "workflow", "automation", "model", "gpt", "langgraph", "evaluation", "checkpoint", "memory"];
const PRODUCT_KEYWORDS = ["product", "prototype", "market", "design", "system", "tool", "strategy"];
const RESEARCH_KEYWORDS = ["research", "notes", "report", "study", "example", "reference"];
const LOW_SIGNAL_KEYWORDS = ["screenshot", "small visual note", "without reusable context", "random", "unclear"];

export function createMockAIProvider(): AIProvider {
  return {
    async analyzeResource({ resource }) {
      const signals = detectSignals(resource);
      return {
        summary: buildSummary(resource.title, resource.content),
        category: signals.category,
        tags: signals.tags,
        confidence: signals.confidence
      } satisfies GeneratedBasicAnalysis;
    },

    async evaluateResourceValue({ resource, basicAnalysis }) {
      const signals = detectSignals(resource);
      const valueScore = scoreResource(signals);
      const recommendation = valueScore >= 75 ? "activate" : valueScore >= 50 ? "review" : "archive";

      return {
        valueScore,
        recommendation,
        activationOpportunities: buildOpportunities(resource.title, valueScore),
        gaps: buildGaps(valueScore, basicAnalysis.category),
        nextBestAction: buildNextBestAction(resource.title, recommendation),
        reasoning:
          recommendation === "activate"
            ? "The resource has enough reusable signal to become a concrete internal activation plan."
            : recommendation === "review"
              ? "The resource has partial signal, but it needs additional context before activation."
              : "The resource is preserved for traceability, but it lacks actionable context right now."
      } satisfies GeneratedValueAssessment;
    },

    async planActivation({ intent, resources, analyses }) {
      const topTags = [...new Set(analyses.flatMap((analysis) => analysis.tags))].slice(0, 4);
      const title = intent.trim() || `Activate ${resources[0]?.title ?? "saved resources"}`;
      const resourceGaps = buildResourceGaps(analyses);
      const supplementalMaterials = [
        {
          title: "User context note",
          reason: "Capture why this matters now, expected users, and the desired station-internal outcome.",
          sourceHint: "manual-note" as const
        },
        {
          title: "Comparable example",
          reason: "Add one adjacent example so the plan is not based only on the original resource.",
          sourceHint: "link" as const
        },
        {
          title: "Success metric note",
          reason: "Define what finished means before starting execution.",
          sourceHint: "manual-note" as const
        }
      ];
      const tasks = [
        {
          id: "task_1",
          title: "Define the activation outcome",
          description: "Turn the selected resource signal into one measurable result inside this workspace.",
          priority: "high" as const,
          permissionScope: "internal" as const,
          status: "todo" as const
        },
        {
          id: "task_2",
          title: "Map useful resource signals",
          description: `Group the strongest internal themes from related tags: ${topTags.join(", ") || "inbox"}.`,
          priority: "medium" as const,
          permissionScope: "internal" as const,
          status: "todo" as const
        },
        {
          id: "task_3",
          title: "Fill missing context",
          description: `Create the supplemental materials: ${supplementalMaterials.map((material) => material.title).join(", ")}.`,
          priority: "high" as const,
          permissionScope: "internal" as const,
          status: "todo" as const
        },
        {
          id: "task_4",
          title: "Build the first internal deliverable",
          description: "Produce a small artifact, checklist, or decision note that can be reviewed without external automation.",
          priority: "high" as const,
          permissionScope: "internal" as const,
          status: "todo" as const
        },
        {
          id: "task_5",
          title: "Run the activation checkpoint",
          description: "Compare the deliverable against the original intent, resource gaps, and review criteria.",
          priority: "medium" as const,
          permissionScope: "internal" as const,
          status: "todo" as const
        }
      ];

      return {
        title,
        phases: [
          {
            id: "phase_1",
            title: "Frame",
            objective: "Clarify the goal, value hypothesis, and missing context.",
            taskIds: ["task_1", "task_2"],
            checkpoint: "The goal has a measurable internal outcome and a resource-backed value hypothesis."
          },
          {
            id: "phase_2",
            title: "Enrich",
            objective: "Fill resource gaps with context that was not present in the original material.",
            taskIds: ["task_3"],
            checkpoint: "Supplemental materials exist for user context, comparable examples, and success metrics."
          },
          {
            id: "phase_3",
            title: "Activate",
            objective: "Create and review a concrete station-internal deliverable.",
            taskIds: ["task_4", "task_5"],
            checkpoint: "The first deliverable has been reviewed and has a follow-up decision."
          }
        ],
        tasks,
        checkpoints: [
          "The user can explain why this resource matters now.",
          "At least one missing resource gap has a concrete fill path.",
          "At least one station-internal task has been completed and reviewed."
        ],
        gaps: resourceGaps.map((gap) => gap.title),
        resourceGaps,
        supplementalMaterials
      } satisfies GeneratedActivationPlan;
    },

    async suggestReview({ analysis, review }) {
      const targetScore = scoreFromActualValue(review.actualValue);
      const previousScore = analysis?.valueScore ?? 50;
      const valueDelta = targetScore - previousScore;
      return {
        actualValue: review.actualValue,
        reviewSuggestions: buildReviewSuggestions(review.actualValue),
        suggestedNextStep: buildSuggestedNextStep(review.actualValue),
        valueDelta
      } satisfies GeneratedReviewAdvice;
    }
  };
}

function detectSignals(resource: Resource) {
  const text = `${resource.title} ${resource.content ?? ""}`.toLowerCase();
  const aiMatches = AI_KEYWORDS.filter((keyword) => text.includes(keyword));
  const productMatches = PRODUCT_KEYWORDS.filter((keyword) => text.includes(keyword));
  const researchMatches = RESEARCH_KEYWORDS.filter((keyword) => text.includes(keyword));
  const lowSignal = LOW_SIGNAL_KEYWORDS.some((keyword) => text.includes(keyword));
  const tags = new Set<string>();
  if (aiMatches.length > 0) tags.add("ai");
  if (text.includes("workflow")) tags.add("workflow");
  if (text.includes("automation")) tags.add("automation");
  if (productMatches.length > 0) tags.add("product");
  if (researchMatches.length > 0) tags.add("research");

  const category = detectCategory({ aiMatches, productMatches, researchMatches, lowSignal });
  return {
    aiMatches,
    productMatches,
    researchMatches,
    lowSignal,
    category,
    tags: tags.size > 0 ? [...tags] : ["inbox"],
    confidence: lowSignal ? 0.58 : Math.min(0.95, 0.62 + aiMatches.length * 0.05 + productMatches.length * 0.04)
  };
}

function detectCategory(input: {
  aiMatches: string[];
  productMatches: string[];
  researchMatches: string[];
  lowSignal: boolean;
}): AnalysisCategory {
  if (input.lowSignal) return "low-signal";
  if (input.aiMatches.length >= 2) return "ai-workflow";
  if (input.productMatches.length >= 2) return "product-strategy";
  if (input.aiMatches.includes("automation")) return "automation";
  if (input.researchMatches.length > 0) return "research";
  if (input.productMatches.length > 0 || input.aiMatches.length > 0) return "reference";
  return "general";
}

function scoreResource(signals: ReturnType<typeof detectSignals>) {
  if (signals.lowSignal) return 35;
  const raw =
    48 +
    signals.aiMatches.length * 8 +
    signals.productMatches.length * 6 +
    signals.researchMatches.length * 3 +
    (signals.category === "ai-workflow" ? 10 : 0) +
    (signals.category === "product-strategy" ? 8 : 0);
  return Math.min(95, Math.max(25, raw));
}

function buildSummary(title: string, content?: string) {
  const cleaned = content?.trim();
  if (!cleaned) return `${title} is preserved as a resource that still needs more context before activation.`;
  const firstSentence = cleaned.split(/[.!?]/)[0]?.trim() || cleaned.slice(0, 120);
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
      confidence: valueScore >= 75 ? 0.88 : 0.68
    },
    {
      mode: "goal-driven" as const,
      title: "Compare against an existing goal",
      action: "Use the resource as supporting material for an active internal goal before creating new work.",
      confidence: valueScore >= 75 ? 0.74 : 0.62
    }
  ];
}

function buildGaps(valueScore: number, category: AnalysisCategory) {
  if (valueScore >= 75) {
    return [
      "Missing success criteria",
      "Missing examples from the user's own context",
      category === "ai-workflow" ? "Missing evaluation checkpoint" : "Missing review checkpoint"
    ];
  }
  if (valueScore >= 50) {
    return ["Missing clear owner intent", "Missing supporting resource examples"];
  }
  return ["Missing reusable details", "Missing a clear goal or next action"];
}

function buildNextBestAction(title: string, recommendation: GeneratedValueAssessment["recommendation"]) {
  if (recommendation === "activate") {
    return {
      title: "Activate as internal goal",
      description: `Turn "${title}" into a goal with phases, tasks, missing materials, and checkpoints.`,
      permissionScope: "internal" as const
    };
  }
  if (recommendation === "review") {
    return {
      title: "Review before activation",
      description: `Add user context and one supporting resource before planning work from "${title}".`,
      permissionScope: "internal" as const
    };
  }
  return {
    title: "Archive or enrich",
    description: `Keep "${title}" with a summary and audit trail, then enrich it if it becomes relevant.`,
    permissionScope: "internal" as const
  };
}

function buildResourceGaps(analyses: Array<{ gaps: string[] }>) {
  const gapTitles = [
    ...new Set([
      ...analyses.flatMap((analysis) => analysis.gaps),
      "Missing success criteria",
      "Missing examples from the user's own context"
    ])
  ].slice(0, 4);
  return gapTitles.map((title) => ({
    title,
    reason: "The current resources do not fully explain this part of the activation path.",
    howToFill: `Add an internal note or supporting resource that answers: ${title.toLowerCase()}.`
  }));
}

function scoreFromActualValue(actualValue: ResourceActualValue) {
  if (actualValue === "high") return 90;
  if (actualValue === "medium") return 65;
  return 30;
}

function buildReviewSuggestions(actualValue: ResourceActualValue) {
  if (actualValue === "high") {
    return [
      {
        title: "Promote the pattern",
        action: "Turn the successful activation into an internal template for similar resources.",
        priority: "high" as const,
        permissionScope: "internal" as const
      },
      {
        title: "Add a reuse checkpoint",
        action: "Record which task, gap, or supplemental material made the resource valuable.",
        priority: "medium" as const,
        permissionScope: "internal" as const
      }
    ];
  }
  if (actualValue === "medium") {
    return [
      {
        title: "Clarify the next experiment",
        action: "Keep the resource active only if one concrete follow-up task is still useful.",
        priority: "medium" as const,
        permissionScope: "internal" as const
      }
    ];
  }
  return [
    {
      title: "Archive with reason",
      action: "Keep the review trail, but stop using this resource as a planning seed.",
      priority: "medium" as const,
      permissionScope: "internal" as const
    }
  ];
}

function buildSuggestedNextStep(actualValue: ResourceActualValue) {
  if (actualValue === "high") {
    return "Create an internal follow-up task that reuses the proven pattern.";
  }
  if (actualValue === "medium") {
    return "Create one internal clarification task before extending the plan.";
  }
  return "Keep an internal archive note and look for stronger supporting material.";
}
