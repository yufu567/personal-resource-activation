/**
 * Research Engine — 三层漏斗 AI 调研引擎
 *
 * Layer 1: 用户资源库（已保存的资源 + 分析记录）— 零成本，高相关
 * Layer 2: AI 内化知识（模型训练数据）— 零成本，综合推理
 * Layer 3: Web 搜索（SearXNG）— 有成本，最新信息
 *
 * 流程：AI 先用自己的知识回答 → 标记不确定的部分 → 仅对不确定部分搜索
 * 最终融合三层来源，每个结论标注来源和可信度。
 */

import type { AIProvider, GeneratedBasicAnalysis, GeneratedValueAssessment } from "./types";
import type { Resource, AnalysisRecord } from "@/core/types";
import { searchUserResources, type UserResourceMatch } from "@/connectors/search/user-resources";

// ── Types ──

export interface ResearchQuestion {
  query: string;
  purpose: string;
  expectedType: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  source: "user-resource" | "ai-knowledge" | "web";
}

export interface ResearchFinding {
  question: string;
  summary: string;
  sources: ResearchSource[];
  confidence: "high" | "medium" | "low";
  gapsFilled: string[];
}

export interface ResearchOutput {
  researchPlan: Array<{ question: string; searchQuery: string; rationale: string }>;
  findings: ResearchFinding[];
  unresolvedGaps: string[];
  /** Number of web searches triggered (cost tracking) */
  webSearchCount: number;
}

// ── Web Search Provider Interface ──

export interface WebSearchProvider {
  search(query: string, limit?: number): Promise<Array<{ title: string; url: string; snippet: string }>>;
}

// ── Engine ──

export class ResearchEngine {
  constructor(
    private readonly ai: AIProvider,
    private readonly webSearch?: WebSearchProvider,
  ) {}

  async research(
    questions: ResearchQuestion[],
    userResources?: Resource[],
    userAnalyses?: AnalysisRecord[],
  ): Promise<ResearchOutput> {
    if (questions.length === 0) {
      return { researchPlan: [], findings: [], unresolvedGaps: [], webSearchCount: 0 };
    }

    const researchPlan = questions.map((q) => ({
      question: q.query,
      searchQuery: q.query,
      rationale: q.purpose,
    }));

    const findings: ResearchFinding[] = [];
    const unresolvedGaps: string[] = [];
    let webSearchCount = 0;

    for (const question of questions) {
      const sources: ResearchSource[] = [];
      let combinedKnowledge = "";

      // ── Layer 1: Search user's existing resources ──
      const resourceMatches = userResources
        ? searchUserResources(question.query, userResources, userAnalyses ?? [], 3)
        : [];

      if (resourceMatches.length > 0) {
        const userContext = resourceMatches
          .map((m) => `[用户资源: ${m.title}] ${m.summary}`)
          .join("\n");
        combinedKnowledge += `\n## 用户已有相关资源\n${userContext}\n`;
        for (const m of resourceMatches) {
          sources.push({
            title: m.title,
            url: `/resources/${m.resourceId}`,
            source: "user-resource" as const,
          });
        }
      }

      // ── Layer 2: AI uses its own knowledge ──
      const aiKnowledge = await this.queryAIKnowledge(question.query, question.purpose, combinedKnowledge);
      combinedKnowledge += `\n## AI 知识\n${aiKnowledge.summary}\n`;
      sources.push({
        title: `AI 模型知识 — ${aiKnowledge.confidence === "high" ? "高可信" : "需验证"}`,
        url: "",
        source: "ai-knowledge" as const,
      });

      // ── Layer 3: Web search (only if needed) ──
      if (aiKnowledge.needsWebSearch && this.webSearch) {
        webSearchCount++;
        const webResults = await this.webSearch.search(question.query, 3);
        if (webResults.length > 0) {
          const webContext = webResults
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n来源: ${r.url}`)
            .join("\n\n");
          combinedKnowledge += `\n## Web 搜索结果\n${webContext}\n`;
          for (const r of webResults) {
            sources.push({
              title: r.title,
              url: r.url,
              source: "web" as const,
            });
          }
        }
      }

      // ── Final: AI synthesizes all layers ──
      const synthesis = await this.synthesize(question.query, question.purpose, combinedKnowledge);

      if (synthesis.summary.length > 10) {
        findings.push({
          question: question.query,
          summary: synthesis.summary,
          sources,
          confidence: synthesis.confidence,
          gapsFilled: [question.query],
        });
      } else {
        unresolvedGaps.push(question.query);
      }
    }

    return { researchPlan, findings, unresolvedGaps, webSearchCount };
  }

  /**
   * Layer 2: Ask AI to answer from its own training knowledge.
   * Returns the answer AND whether it needs web search verification.
   */
  private async queryAIKnowledge(
    query: string,
    purpose: string,
    existingContext: string,
  ): Promise<{ summary: string; confidence: "high" | "medium" | "low"; needsWebSearch: boolean }> {
    // Use the AI's analyzeResource to get a structured answer
    // This is zero-cost in terms of external search — just the LLM call
    try {
      const mockResource: Resource = {
        id: `research_${Date.now()}`,
        userId: "system",
        source: "link" as const,
        title: query,
        content: `调研目的：${purpose}\n${existingContext || "无额外上下文"}`,
        status: "new" as const,
        shareVisibility: "private" as const,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const analysis = await this.ai.analyzeResource({ resource: mockResource });

      const summary = analysis.summary ?? "";
      const confidence = analysis.confidence > 0.8 ? ("high" as const) : analysis.confidence > 0.5 ? ("medium" as const) : ("low" as const);
      const needsWebSearch = confidence !== "high";

      return { summary, confidence, needsWebSearch };
    } catch {
      return {
        summary: "",
        confidence: "low" as const,
        needsWebSearch: true,
      };
    }
  }

  /**
   * Final synthesis: AI combines all three layers into a coherent answer.
   */
  private async synthesize(
    question: string,
    purpose: string,
    allContext: string,
  ): Promise<{ summary: string; confidence: "high" | "medium" | "low" }> {
    if (!allContext || allContext.length < 20) {
      return { summary: "", confidence: "low" as const };
    }

    // Build a synthesis from the combined context
    // For now, extract key points. In production, this would be another AI call.
    const sections = allContext.split("## ").filter(Boolean);
    const keyPoints = sections
      .map((s) => s.split("\n").filter((l) => l.trim().length > 10).slice(0, 3).join("; "))
      .filter(Boolean)
      .slice(0, 3);

    const summary = keyPoints.length > 0
      ? `基于 ${sections.length} 个来源的综合分析：${keyPoints.join(" | ")}`.slice(0, 400)
      : "";

    return {
      summary,
      confidence: sections.length >= 2 ? "medium" as const : "low" as const,
    };
  }
}
