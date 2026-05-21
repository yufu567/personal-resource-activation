import { createMockAIProvider } from "@/ai/mock-provider";
import { ActivationPlanner, type CreateGoalFromResourcesInput } from "@/core/activation-planner";
import { ResourceAnalyzer } from "@/core/resource-analyzer";
import { InMemoryResourceStore } from "@/core/resource-store";
import { ReviewEngine, type RecordReviewInput } from "@/core/review-engine";
import type { AnalysisRecord, CreateResourceInput, Resource } from "@/core/types";

export interface ResourceActivationSnapshot {
  userId: string;
  resources: Resource[];
  analyses: AnalysisRecord[];
  goals: ReturnType<InMemoryResourceStore["listGoals"]>;
  reviews: ReturnType<InMemoryResourceStore["listReviews"]>;
  metrics: {
    totalResources: number;
    analyzedResources: number;
    activeGoals: number;
    reviewedResources: number;
    averageValueScore: number;
  };
}

export class ResourceActivationService {
  private readonly demoSeededUsers = new Set<string>();
  private readonly store = new InMemoryResourceStore();
  private readonly analyzer = new ResourceAnalyzer(createMockAIProvider(), this.store);
  private readonly planner = new ActivationPlanner(createMockAIProvider(), this.store);
  private readonly reviewer = new ReviewEngine(this.store);

  async addResource(input: CreateResourceInput) {
    const resource = this.store.createResource(input);
    const analysis = await this.analyzer.analyze(input.userId, resource.id);
    return { resource: this.store.requireResource(input.userId, resource.id), analysis };
  }

  async createGoalFromResources(input: CreateGoalFromResourcesInput) {
    return this.planner.createGoalFromResources(input);
  }

  async seedDemo(userId = "demo-user") {
    if (this.demoSeededUsers.has(userId)) {
      return this.getSnapshot(userId);
    }
    this.demoSeededUsers.add(userId);

    const github = await this.addResource({
      userId,
      source: "github",
      title: "Agent workflow framework",
      url: "https://github.com/example/agent-workflow",
      content: "A toolkit for AI agent workflow orchestration, checkpoints, and memory-backed automation."
    });
    const xPost = await this.addResource({
      userId,
      source: "x",
      title: "Thread about personal automation",
      url: "https://x.com/example/status/1",
      content: "A practical thread on turning saved links into product ideas and small automation workflows."
    });
    const link = await this.addResource({
      userId,
      source: "link",
      title: "Resource activation product notes",
      url: "https://example.com/resource-activation",
      content: "Product design notes for classifying saved resources and turning them into action plans."
    });
    await this.addResource({
      userId,
      source: "drive",
      title: "activation-research.md",
      content: "Research notes about resource activation, review loops, and user-owned automation.",
      collectionPath: "AI Resource Inbox"
    });

    const goal = await this.createGoalFromResources({
      userId,
      resourceIds: [github.resource.id, xPost.resource.id, link.resource.id],
      intent: "把囤积的资源转成站内可执行的个人激活系统"
    });

    this.recordReview({
      userId,
      resourceId: github.resource.id,
      goalId: goal.id,
      outcome: "produced-output",
      actualValue: "high",
      reflection: "This resource became the first internal activation workflow."
    });

    return this.getSnapshot(userId);
  }

  recordReview(input: RecordReviewInput) {
    return this.reviewer.recordReview(input);
  }

  getSnapshot(userId: string): ResourceActivationSnapshot {
    const resources = this.store.listResources(userId);
    const analyses = this.store.listAnalyses(userId);
    const goals = this.store.listGoals(userId);
    const reviews = this.store.listReviews(userId);
    const averageValueScore =
      analyses.length === 0
        ? 0
        : Math.round(analyses.reduce((total, analysis) => total + analysis.valueScore, 0) / analyses.length);

    return {
      userId,
      resources,
      analyses,
      goals,
      reviews,
      metrics: {
        totalResources: resources.length,
        analyzedResources: analyses.length,
        activeGoals: goals.filter((goal) => goal.status === "active").length,
        reviewedResources: reviews.length,
        averageValueScore
      }
    };
  }
}

export function createResourceActivationService() {
  return new ResourceActivationService();
}

let singleton: ResourceActivationService | undefined;

export function getResourceActivationService() {
  singleton ??= createResourceActivationService();
  return singleton;
}
