import type { AIProvider } from "@/ai/types";
import type { AnalysisRecord } from "./types";
import type { Store } from "./store";

export class ResourceAnalyzer {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly store: Store,
  ) {}

  async analyze(userId: string, resourceId: string): Promise<AnalysisRecord> {
    const resource = await this.store.requireResource(userId, resourceId);
    const basicAnalysis = await this.aiProvider.analyzeResource({ resource });
    const valueAssessment = await this.aiProvider.evaluateResourceValue({
      resource,
      basicAnalysis,
    });
    const analysis = await this.store.saveAnalysis({
      userId,
      resourceId,
      ...basicAnalysis,
      ...valueAssessment,
    });
    await this.store.updateResourceStatus(userId, resourceId, "analyzed");
    await this.store.addAuditEvent({
      userId,
      resourceId,
      type: "analysis.completed",
      message: `Analysis completed with recommendation "${analysis.recommendation}".`,
      metadata: { valueScore: analysis.valueScore }
    });
    return analysis;
  }
}
