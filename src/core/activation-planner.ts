import type { AIProvider } from "@/ai/types";
import type { ActivationGoal, Resource } from "./types";
import type { Store } from "./store";

export interface CreateGoalFromResourcesInput {
  userId: string;
  resourceIds: string[];
  intent: string;
}

export class ActivationPlanner {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly store: Store,
  ) {}

  async createGoalFromResources(input: CreateGoalFromResourcesInput): Promise<ActivationGoal> {
    const resources: Resource[] = [];
    for (const resourceId of input.resourceIds) {
      resources.push(await this.store.requireResource(input.userId, resourceId));
    }
    const analyses = (
      await Promise.all(
        resources.map((r) => this.store.getAnalysis(input.userId, r.id)),
      )
    ).filter((a) => a !== undefined);
    const generated = await this.aiProvider.planActivation({
      intent: input.intent,
      resources,
      analyses,
    });
    const goal = await this.store.saveGoal({
      userId: input.userId,
      intent: input.intent,
      resourceIds: input.resourceIds,
      status: "active",
      ...generated,
    });

    for (const resource of resources) {
      await this.store.addAuditEvent({
        userId: input.userId,
        resourceId: resource.id,
        type: "goal.created",
        message: `Resource was activated into goal "${goal.title}".`,
        metadata: { goalId: goal.id },
      });
    }

    return goal;
  }
}
