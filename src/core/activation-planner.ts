import type { AIProvider } from "@/ai/types";
import type { ActivationGoal } from "./types";
import { InMemoryResourceStore } from "./resource-store";

export interface CreateGoalFromResourcesInput {
  userId: string;
  resourceIds: string[];
  intent: string;
}

export class ActivationPlanner {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly store: InMemoryResourceStore
  ) {}

  async createGoalFromResources(input: CreateGoalFromResourcesInput): Promise<ActivationGoal> {
    const resources = input.resourceIds.map((resourceId) => this.store.requireResource(input.userId, resourceId));
    const analyses = resources
      .map((resource) => this.store.getAnalysis(input.userId, resource.id))
      .filter((analysis) => analysis !== undefined);
    const generated = await this.aiProvider.planActivation({
      intent: input.intent,
      resources,
      analyses
    });
    const goal = this.store.saveGoal({
      userId: input.userId,
      intent: input.intent,
      resourceIds: input.resourceIds,
      status: "active",
      ...generated
    });

    for (const resource of resources) {
      this.store.addAuditEvent({
        userId: input.userId,
        resourceId: resource.id,
        type: "goal.created",
        message: `Resource was activated into goal "${goal.title}".`,
        metadata: { goalId: goal.id }
      });
    }

    return goal;
  }
}
