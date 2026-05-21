import OpenAI from "openai";
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

function createOpenAIProvider(
  apiKey: string,
  spec: SpecContext,
  baseUrl?: string,
  model = "gpt-4o",
): AIProvider {
  const client = new OpenAI({ apiKey, baseURL: baseUrl || undefined });

  const TASK_INSTRUCTIONS = {
    intake: `请执行 Intake Workflow（参见工作流规范中的 intake.md）。
输入是用户提供的一个资源。你必须输出严格的 JSON，不要 markdown 包装。

输出 JSON schema：
{
  "summary": "中文一句话总结",
  "category": "领域标识（如 engineering, product, finance, health, science, design, general）",
  "tags": ["小写英文标签"],
  "confidence": 0.0-1.0
}

同时输出 value 评估（与 intake 合并为一次调用）：
{
  "valueScore": 0-100,
  "recommendation": "activate" | "review" | "archive",
  "activationOpportunities": [{"mode": "resource-driven", "title": "标题", "action": "具体行动", "confidence": 0.8}],
  "gaps": ["缺口1", "缺口2"],
  "nextBestAction": {"title": "标题", "description": "描述", "permissionScope": "internal"},
  "reasoning": "评分理由（中文）"
}

将 intake 和 evaluate 两个部分合并到一个 JSON 对象中输出。`,

    plan: `请执行 Plan Workflow（参见工作流规范中的 plan.md）。
根据用户提供的意图、资源和分析结果，生成激活计划。

输出 JSON schema：
{
  "title": "目标标题",
  "phases": [{"id": "phase_1", "title": "阶段名", "objective": "目标", "taskIds": ["task_1"], "checkpoint": "完成标准"}],
  "tasks": [{"id": "task_1", "title": "任务名", "description": "怎么做", "priority": "high"|"medium"|"low"}],
  "checkpoints": ["检查点"],
  "gaps": ["需要调研的问题"],
  "resourceGaps": [{"title": "缺口", "reason": "原因", "howToFill": "怎么补"}],
  "supplementalMaterials": [{"title": "材料名", "reason": "原因", "sourceHint": "manual-note"|"link"}]
}`,

    reflect: `请执行 Reflect Workflow（参见工作流规范中的 reflect.md）。
根据复盘数据给出建议。

输出 JSON schema：
{
  "reviewSuggestions": [{"title": "建议", "action": "行动", "priority": "high"|"medium"|"low", "permissionScope": "internal"}],
  "suggestedNextStep": "下一步（中文）",
  "valueDelta": <number>
}`,
  };

  return {
    async analyzeResource({ resource }: AnalyzeResourceInput): Promise<GeneratedBasicAnalysis> {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: spec.systemPrompt + "\n\n" + TASK_INSTRUCTIONS.intake },
          {
            role: "user",
            content: JSON.stringify({ title: resource.title, content: resource.content, url: resource.url }),
          },
        ],
      });
      const json = JSON.parse(response.choices[0]?.message?.content ?? "{}");
      return {
        summary: (json.summary as string) ?? `${resource.title}`,
        category: (json.category as GeneratedBasicAnalysis["category"]) ?? "general",
        tags: (json.tags as string[]) ?? [],
        confidence: Math.min(0.95, (json.confidence as number) ?? 0.7),
      };
    },

    async evaluateResourceValue({
      resource,
    }: EvaluateResourceValueInput): Promise<GeneratedValueAssessment> {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: spec.systemPrompt + "\n\n" + TASK_INSTRUCTIONS.intake },
          {
            role: "user",
            content: JSON.stringify({ title: resource.title, content: resource.content, url: resource.url }),
          },
        ],
      });
      const json = JSON.parse(response.choices[0]?.message?.content ?? "{}");
      return {
        valueScore: (json.valueScore as number) ?? 50,
        recommendation:
          (json.recommendation as GeneratedValueAssessment["recommendation"]) ?? "review",
        activationOpportunities:
          (json.activationOpportunities as GeneratedValueAssessment["activationOpportunities"]) ?? [],
        gaps: (json.gaps as string[]) ?? [],
        nextBestAction: (json.nextBestAction ?? {
          title: "Review",
          description: "Review this resource.",
          permissionScope: "internal",
        }) as GeneratedValueAssessment["nextBestAction"],
        reasoning: (json.reasoning as string) ?? "",
      };
    },

    async planActivation({
      intent,
      resources,
      analyses,
    }: PlanActivationInput): Promise<GeneratedActivationPlan> {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: spec.systemPrompt + "\n\n" + TASK_INSTRUCTIONS.plan },
          {
            role: "user",
            content: JSON.stringify({
              intent,
              resources: resources.map((r) => ({
                title: r.title,
                source: r.source,
                content: r.content,
              })),
              analyses: analyses.map((a) => ({
                summary: a.summary,
                category: a.category,
                tags: a.tags,
                valueScore: a.valueScore,
                gaps: a.gaps,
              })),
            }),
          },
        ],
      });
      const json = JSON.parse(response.choices[0]?.message?.content ?? "{}");

      // Map domain model phases to match the output format
      const phases = (json.phases as Array<Record<string, unknown>>) ?? [];
      const rawTasks = (json.tasks as Array<Record<string, unknown>>) ?? [];
      const tasks = rawTasks.map((t, i) => {
        const phaseId = (t.phaseId as string) ?? phases[0]?.id ?? "phase_1";
        return {
          id: (t.id as string) ?? `task_${i + 1}`,
          title: (t.title as string) ?? "",
          description: (t.how as string) ?? (t.description as string) ?? "",
          priority: ((t.priority as string) ?? "medium") as "high" | "medium" | "low",
          permissionScope: "internal" as const,
          status: "todo" as const,
        };
      });

      const mappedPhases = phases.map((p) => ({
        id: (p.id as string) ?? "phase_1",
        title: (p.title as string) ?? "",
        objective: (p.objective as string) ?? "",
        taskIds: (p.taskIds as string[]) ?? tasks.map((t) => t.id),
        checkpoint: (p.checkpoint as string) ?? "",
      }));

      return {
        title: (json.title as string) ?? intent,
        phases: mappedPhases,
        tasks,
        checkpoints: (json.checkpoints as string[]) ?? [],
        gaps: (json.gaps as string[]) ?? [],
        resourceGaps:
          (json.resourceGaps as GeneratedActivationPlan["resourceGaps"]) ?? [],
        supplementalMaterials:
          (json.supplementalMaterials as GeneratedActivationPlan["supplementalMaterials"]) ?? [],
      };
    },

    async suggestReview({
      resource,
      analysis,
      review,
    }: SuggestReviewInput): Promise<GeneratedReviewAdvice> {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: spec.systemPrompt + "\n\n" + TASK_INSTRUCTIONS.reflect },
          {
            role: "user",
            content: JSON.stringify({
              resource: resource.title,
              previousScore: analysis?.valueScore,
              outcome: review.outcome,
              actualValue: review.actualValue,
              reflection: review.reflection,
            }),
          },
        ],
      });
      const json = JSON.parse(response.choices[0]?.message?.content ?? "{}");
      return {
        actualValue: review.actualValue,
        reviewSuggestions:
          (json.reviewSuggestions as GeneratedReviewAdvice["reviewSuggestions"]) ?? [],
        suggestedNextStep:
          (json.suggestedNextStep as string) ?? "Keep the next action internal.",
        valueDelta: (json.valueDelta as number) ?? 0,
      };
    },
  };
}

export { createOpenAIProvider };
