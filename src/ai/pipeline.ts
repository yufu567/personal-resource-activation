/**
 * Pipeline — AI 激活流水线
 *
 * 5 步流水线：Intake → Evaluate → Plan → Research → Reflect
 * 每步有明确的输入、输出和 gate 检查。
 *
 * 使用方式：
 *   const pipeline = new Pipeline(aiProvider, specContext);
 *   const intakeResult = await pipeline.intake(resource);
 *   const evalResult = await pipeline.evaluate(resource, intakeResult);
 *   ...
 */

import type { AIProvider } from "./types";
import type { SpecContext } from "./spec-loader";
import { ResearchEngine } from "./research-engine";
import type { ResearchOutput as EngineResearchOutput, ResearchQuestion } from "./research-engine";
import type { Resource, AnalysisRecord } from "@/core/types";

// ── Pipeline Output Types ──

export interface IntakeOutput {
  summary: string;
  domain: string;       // "engineering" | "product" | "finance" | ...
  domainLabel: string;  // "技术/工程" | ...
  medium: "text" | "image" | "video" | "audio" | "mixed";
  tags: string[];
  qualityFlag: "good" | "incomplete" | "outdated" | "unclear";
  confidence: number;
  needsUserInput: boolean;
}

export interface EvaluateOutput {
  valueScore: number;
  potential: "seed" | "fuel" | "archive";
  recommendation: "activate" | "review" | "archive";
  activationAngles: Array<{
    title: string;
    how: string;
    confidence: number;
  }>;
  gaps: Array<{
    type: "context" | "knowledge" | "tool" | "verification";
    title: string;
    severity: "high" | "medium" | "low";
    howToFill: string;
  }>;
  reasoning: string;
}

export interface PlanOutput {
  goalTitle: string;
  successCriteria: string;
  phases: Array<{
    id: string;
    title: string;
    objective: string;
    checkpoint: string;
  }>;
  tasks: Array<{
    id: string;
    phaseId: string;
    title: string;
    how: string;
    priority: "high" | "medium" | "low";
  }>;
  researchQuestions: Array<{
    query: string;
    purpose: string;
    expectedType: string;
  }>;
  supplementalMaterials: Array<{
    title: string;
    reason: string;
    sourceHint: string;
  }>;
}

export type { ResearchOutput } from "./research-engine";

export interface ReflectOutput {
  valueDelta: number;
  reviewSuggestions: Array<{
    title: string;
    action: string;
    priority: "high" | "medium" | "low";
  }>;
  suggestedNextStep: string;
  patternUpdates: Array<{
    file: string;
    section: string;
    suggestedContent: string;
    rationale: string;
  }>;
  specSuggestions: Array<{
    file: string;
    change: string;
    rationale: string;
  }>;
}

// ── Pipeline ──

export class Pipeline {
  private researchEngine: ResearchEngine | null = null;

  constructor(
    private ai: AIProvider,
    private spec: SpecContext,
  ) {}

  /** Inject a research engine for Step 4 */
  setResearchEngine(engine: ResearchEngine) {
    this.researchEngine = engine;
  }

  /** Step 1: Understand the resource */
  async intake(resource: Resource): Promise<IntakeOutput> {
    const response = await this.ai.analyzeResource({ resource });
    return {
      summary: response.summary,
      domain: response.category ?? "general",
      domainLabel: DOMAIN_LABELS[response.category as string] ?? "通用",
      medium: inferMedium(resource),
      tags: response.tags,
      qualityFlag: response.confidence > 0.7 ? "good" : "unclear",
      confidence: response.confidence,
      needsUserInput: response.confidence < 0.5,
    };
  }

  /** Step 2: Evaluate activation value */
  async evaluate(resource: Resource, intake: IntakeOutput): Promise<EvaluateOutput> {
    const response = await this.ai.evaluateResourceValue({
      resource,
      basicAnalysis: {
        summary: intake.summary,
        category: intake.domain as AnalysisRecord["category"],
        tags: intake.tags,
        confidence: intake.confidence,
      },
    });

    return {
      valueScore: response.valueScore,
      potential: scoreToPotential(response.valueScore),
      recommendation: response.recommendation,
      activationAngles: (response.activationOpportunities ?? []).map((op) => ({
        title: op.title,
        how: op.action,
        confidence: op.confidence,
      })),
      gaps: (response.gaps ?? []).map((g, i) => ({
        type: "context" as const,
        title: g,
        severity: i === 0 ? "high" as const : "medium" as const,
        howToFill: "",
      })),
      reasoning: response.reasoning,
    };
  }

  /** Step 3: Generate activation plan */
  async plan(
    resources: Resource[],
    analyses: AnalysisRecord[],
    intent: string,
  ): Promise<PlanOutput> {
    const response = await this.ai.planActivation({
      intent,
      resources,
      analyses,
    });

    return {
      goalTitle: response.title,
      successCriteria: response.checkpoints?.[0] ?? "",
      phases: (response.phases ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        objective: p.objective,
        checkpoint: p.checkpoint,
      })),
      tasks: (response.tasks ?? []).map((t) => ({
        id: t.id,
        phaseId: response.phases?.find((p) => p.taskIds.includes(t.id))?.id ?? "p1",
        title: t.title,
        how: t.description,
        priority: t.priority,
      })),
      researchQuestions: (response.gaps ?? []).map((g) => ({
        query: g,
        purpose: "填补激活计划的缺口",
        expectedType: "相关信息",
      })),
      supplementalMaterials: (response.supplementalMaterials ?? []).map((m) => ({
        title: m.title,
        reason: m.reason,
        sourceHint: m.sourceHint,
      })),
    };
  }

  /** Step 4: Research to fill gaps */
  async research(plan: PlanOutput): Promise<EngineResearchOutput> {
    if (!this.researchEngine) {
      return {
        researchPlan: plan.researchQuestions.map((q) => ({
          question: q.query,
          searchQuery: q.query,
          rationale: q.purpose,
        })),
        findings: [],
        unresolvedGaps: plan.researchQuestions.map((q) => q.query),
        webSearchCount: 0,
      };
    }

    const questions: ResearchQuestion[] = plan.researchQuestions.map((q) => ({
      query: q.query,
      purpose: q.purpose,
      expectedType: q.expectedType,
    }));

    return this.researchEngine.research(questions);
  }

  /** Step 5: Reflect on outcomes */
  async reflect(
    resource: Resource,
    analysis: AnalysisRecord | undefined,
    outcome: string,
    actualValue: "high" | "medium" | "low",
    reflection: string,
  ): Promise<ReflectOutput> {
    const response = await this.ai.suggestReview({
      resource,
      analysis,
      review: {
        outcome: outcome as "produced-output" | "learned" | "discarded" | "needs-more-work",
        actualValue,
        reflection,
        goalId: undefined,
        outputUrl: undefined,
      },
    });

    return {
      valueDelta: response.valueDelta,
      reviewSuggestions: response.reviewSuggestions,
      suggestedNextStep: response.suggestedNextStep,
      patternUpdates: [],
      specSuggestions: [],
    };
  }
}

// ── Helpers ──

const DOMAIN_LABELS: Record<string, string> = {
  "ai-workflow": "技术/工程",
  engineering: "技术/工程",
  "product-strategy": "产品/商业",
  product: "产品/商业",
  finance: "金融/投资",
  health: "健康/医疗",
  science: "科学/研究",
  design: "创作/设计",
  automation: "技术/工程",
  research: "科学/研究",
  reference: "通用",
  general: "通用",
  "low-signal": "通用",
};

function inferMedium(resource: Resource): IntakeOutput["medium"] {
  const content = resource.content ?? "";
  const url = resource.url ?? "";
  // Simple heuristic inference
  if (/youtube\.com|youtu\.be|bilibili\.com|\.mp4|\.mov|\.webm/i.test(url)) return "video";
  if (/\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|screenshot/i.test(url + content)) return "image";
  if (/\.mp3|\.wav|\.ogg|podcast/i.test(url)) return "audio";
  if (content.length > 200) return "text";
  return "text";
}

function scoreToPotential(score: number): "seed" | "fuel" | "archive" {
  if (score >= 75) return "seed";
  if (score >= 50) return "fuel";
  return "archive";
}
