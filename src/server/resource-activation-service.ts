import { createAIProvider } from "@/ai/factory";
import { ActivationPlanner, type CreateGoalFromResourcesInput } from "@/core/activation-planner";
import { PostgresResourceStore } from "@/core/postgres-store";
import { ResourceAnalyzer } from "@/core/resource-analyzer";
import { InMemoryResourceStore } from "@/core/resource-store";
import { ReviewEngine, type RecordReviewInput } from "@/core/review-engine";
import type { AnalysisRecord, CreateResourceInput, Resource } from "@/core/types";

export interface ResourceActivationSnapshot {
  userId: string;
  resources: Resource[];
  analyses: AnalysisRecord[];
  goals: Awaited<ReturnType<InMemoryResourceStore["listGoals"]>>;
  reviews: Awaited<ReturnType<InMemoryResourceStore["listReviews"]>>;
  metrics: {
    totalResources: number;
    analyzedResources: number;
    activeGoals: number;
    reviewedResources: number;
    averageValueScore: number;
  };
}

type Store = InMemoryResourceStore | PostgresResourceStore;

function createStore(): Store {
  const storeBackend = process.env.STORE ?? "memory";
  if (storeBackend === "postgres") {
    return new PostgresResourceStore();
  }
  return new InMemoryResourceStore();
}

export class ResourceActivationService {
  private readonly demoSeededUsers = new Set<string>();
  private readonly store: Store = createStore();
  private readonly analyzer = new ResourceAnalyzer(createAIProvider(), this.store);
  private readonly planner = new ActivationPlanner(createAIProvider(), this.store);
  private readonly reviewer = new ReviewEngine(this.store);

  async addResource(input: CreateResourceInput) {
    const resource = await this.store.createResource(input);
    const analysis = await this.analyzer.analyze(input.userId, resource.id);
    return { resource: await this.store.requireResource(input.userId, resource.id), analysis };
  }

  async createGoalFromResources(input: CreateGoalFromResourcesInput) {
    return this.planner.createGoalFromResources(input);
  }

  private async ensureUserRow(userId: string) {
    if (process.env.STORE !== "postgres") return;
    try {
      const { getDb } = await import("@/db");
      const { users } = await import("@/db/schema");
      const db = getDb();
      await db.insert(users).values({
        id: userId,
        email: `${userId}@demo.local`,
        displayName: userId,
        authProvider: "demo",
      }).onConflictDoNothing();
    } catch {
      // User may already exist or DB may not be available
    }
  }

  async seedDemo(userId = "demo-user") {
    // Check in-memory cache first
    if (this.demoSeededUsers.has(userId)) {
      return this.getSnapshot(userId);
    }

    // Check if user already has resources (e.g. after Docker restart)
    const existing = await this.store.listResources(userId);
    if (existing.length > 0) {
      this.demoSeededUsers.add(userId);
      return this.getSnapshot(userId);
    }

    this.demoSeededUsers.add(userId);

    // Ensure user row exists in PostgreSQL (for FK constraints)
    await this.ensureUserRow(userId);

    const github = await this.addResource({
      userId,
      source: "github",
      title: "Agent workflow framework",
      url: "https://github.com/example/agent-workflow",
      content: "A toolkit for AI agent workflow orchestration, checkpoints, and memory-backed automation.",
    });
    const xPost = await this.addResource({
      userId,
      source: "x",
      title: "Thread about personal automation",
      url: "https://x.com/example/status/1",
      content: "A practical thread on turning saved links into product ideas and small automation workflows.",
    });
    const link = await this.addResource({
      userId,
      source: "link",
      title: "Resource activation product notes",
      url: "https://example.com/resource-activation",
      content: "Product design notes for classifying saved resources and turning them into action plans.",
    });
    await this.addResource({
      userId,
      source: "drive",
      title: "activation-research.md",
      content: "Research notes about resource activation, review loops, and user-owned automation.",
      collectionPath: "AI Resource Inbox",
    });

    const goal = await this.createGoalFromResources({
      userId,
      resourceIds: [github.resource.id, xPost.resource.id, link.resource.id],
      intent: "把囤积的资源转成站内可执行的个人激活系统",
    });

    await this.recordReview({
      userId,
      resourceId: github.resource.id,
      goalId: goal.id,
      outcome: "produced-output",
      actualValue: "high",
      reflection: "This resource became the first internal activation workflow.",
    });

    return this.getSnapshot(userId);
  }

  async recordReview(input: RecordReviewInput) {
    return this.reviewer.recordReview(input);
  }

  async getSnapshot(userId: string): Promise<ResourceActivationSnapshot> {
    const [resources, analyses, goals, reviews] = await Promise.all([
      this.store.listResources(userId),
      this.store.listAnalyses(userId),
      this.store.listGoals(userId),
      this.store.listReviews(userId),
    ]);

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
        averageValueScore,
      },
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
