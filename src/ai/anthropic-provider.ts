import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  GeneratedBasicAnalysis,
  GeneratedValueAssessment,
  GeneratedActivationPlan,
  GeneratedReviewAdvice,
} from "./types";
import type {
  AnalyzeResourceInput,
  EvaluateResourceValueInput,
  PlanActivationInput,
  SuggestReviewInput,
} from "./types";
import type { SpecContext } from "./spec-loader";

function createAnthropicProvider(
  apiKey: string,
  spec: SpecContext,
  model = "claude-sonnet-4-20250514",
): AIProvider {
  const client = new Anthropic({ apiKey });

  async function askJson(
    system: string,
    userContent: string,
    temperature = 0.3,
  ): Promise<Record<string, unknown>> {
    const msg = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature,
      system,
      messages: [{ role: "user", content: userContent }],
    });
    const text = (msg.content[0] as { text: string }).text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  const TASK = {
    intake: `${spec.systemPrompt}

## 当前任务：Intake + Evaluate

执行工作流规范中的 intake.md 和 evaluate.md。合并为一次输出。
输出严格 JSON：
{
  "summary": "中文一句话总结",
  "category": "领域标识",
  "tags": ["标签"],
  "confidence": 0.85,
  "valueScore": 78,
  "recommendation": "activate" | "review" | "archive",
  "activationOpportunities": [{"mode": "resource-driven", "title": "标题", "action": "行动", "confidence": 0.8}],
  "gaps": ["缺口"],
  "nextBestAction": {"title": "标题", "description": "描述", "permissionScope": "internal"},
  "reasoning": "评分理由"
}`,

    plan: `${spec.systemPrompt}

## 当前任务：Plan

执行工作流规范中的 plan.md。
输出严格 JSON：
{
  "title": "目标标题",
  "phases": [{"id": "phase_1", "title": "阶段名", "objective": "目标", "taskIds": ["task_1"], "checkpoint": "标准"}],
  "tasks": [{"id": "task_1", "title": "任务名", "description": "怎么做", "priority": "high"}],
  "checkpoints": ["检查点"],
  "gaps": ["调研问题"],
  "resourceGaps": [{"title": "缺口", "reason": "原因", "howToFill": "怎么补"}],
  "supplementalMaterials": [{"title": "材料", "reason": "原因", "sourceHint": "manual-note"}]
}`,

    reflect: `${spec.systemPrompt}

## 当前任务：Reflect

执行工作流规范中的 reflect.md。
输出严格 JSON：
{
  "reviewSuggestions": [{"title": "建议", "action": "行动", "priority": "high", "permissionScope": "internal"}],
  "suggestedNextStep": "下一步",
  "valueDelta": 15
}`,
  };

  return {
    async analyzeResource({ resource }: AnalyzeResourceInput): Promise<GeneratedBasicAnalysis> {
      const json = await askJson(
        TASK.intake,
        JSON.stringify({ title: resource.title, content: resource.content, url: resource.url }),
      );
      return {
        summary: (json.summary as string) ?? `${resource.title}`,
        category: (json.category as GeneratedBasicAnalysis["category"]) ?? "general",
        tags: (json.tags as string[]) ?? [],
        confidence: Math.min(0.95, (json.confidence as number) ?? 0.7),
      };
    },

    async evaluateResourceValue({ resource }: EvaluateResourceValueInput): Promise<GeneratedValueAssessment> {
      const json = await askJson(
        TASK.intake,
        JSON.stringify({ title: resource.title, content: resource.content, url: resource.url }),
      );
      return {
        valueScore: (json.valueScore as number) ?? 50,
        recommendation: (json.recommendation as GeneratedValueAssessment["recommendation"]) ?? "review",
        activationOpportunities: (json.activationOpportunities as GeneratedValueAssessment["activationOpportunities"]) ?? [],
        gaps: (json.gaps as string[]) ?? [],
        nextBestAction: (json.nextBestAction ?? { title: "Review", description: "Review.", permissionScope: "internal" }) as GeneratedValueAssessment["nextBestAction"],
        reasoning: (json.reasoning as string) ?? "",
      };
    },

    async planActivation({ intent, resources, analyses }: PlanActivationInput): Promise<GeneratedActivationPlan> {
      const json = await askJson(
        TASK.plan,
        JSON.stringify({
          intent,
          resources: resources.map((r) => ({ title: r.title, source: r.source, content: r.content })),
          analyses: analyses.map((a) => ({ summary: a.summary, category: a.category, tags: a.tags, valueScore: a.valueScore, gaps: a.gaps })),
        }),
        0.4,
      );

      const phases = (json.phases as Array<Record<string, unknown>>) ?? [];
      const rawTasks = (json.tasks as Array<Record<string, unknown>>) ?? [];
      const tasks = rawTasks.map((t, i) => ({
        id: (t.id as string) ?? `task_${i + 1}`,
        title: (t.title as string) ?? "",
        description: (t.how as string) ?? (t.description as string) ?? "",
        priority: ((t.priority as string) ?? "medium") as "high" | "medium" | "low",
        permissionScope: "internal" as const,
        status: "todo" as const,
      }));

      return {
        title: (json.title as string) ?? intent,
        phases: phases.map((p) => ({
          id: (p.id as string) ?? "phase_1",
          title: (p.title as string) ?? "",
          objective: (p.objective as string) ?? "",
          taskIds: (p.taskIds as string[]) ?? tasks.map((t) => t.id),
          checkpoint: (p.checkpoint as string) ?? "",
        })),
        tasks,
        checkpoints: (json.checkpoints as string[]) ?? [],
        gaps: (json.gaps as string[]) ?? [],
        resourceGaps: (json.resourceGaps as GeneratedActivationPlan["resourceGaps"]) ?? [],
        supplementalMaterials: (json.supplementalMaterials as GeneratedActivationPlan["supplementalMaterials"]) ?? [],
      };
    },

    async suggestReview({ resource, analysis, review }: SuggestReviewInput): Promise<GeneratedReviewAdvice> {
      const json = await askJson(
        TASK.reflect,
        JSON.stringify({ resource: resource.title, previousScore: analysis?.valueScore, outcome: review.outcome, actualValue: review.actualValue, reflection: review.reflection }),
      );
      return {
        actualValue: review.actualValue,
        reviewSuggestions: (json.reviewSuggestions as GeneratedReviewAdvice["reviewSuggestions"]) ?? [],
        suggestedNextStep: (json.suggestedNextStep as string) ?? "Keep next action internal.",
        valueDelta: (json.valueDelta as number) ?? 0,
      };
    },
  };
}

export { createAnthropicProvider };
