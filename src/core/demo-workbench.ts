import { createMockAIProvider } from "@/ai/mock-provider";
import { DriveFolderConnector } from "@/connectors/drive-folder-connector";
import { ActivationPlanner } from "./activation-planner";
import { ResourceAnalyzer } from "./resource-analyzer";
import { InMemoryResourceStore } from "./resource-store";
import { ReviewEngine } from "./review-engine";
import type { ActivationGoal, AnalysisRecord, Resource, ReviewLog } from "./types";

export interface WorkbenchSnapshot {
  userId: string;
  resources: Resource[];
  analyses: AnalysisRecord[];
  goals: ActivationGoal[];
  reviews: ReviewLog[];
  metrics: {
    totalResources: number;
    analyzedResources: number;
    activeGoals: number;
    reviewedResources: number;
    averageValueScore: number;
  };
}

export async function createDemoWorkbench(userId = "demo-user"): Promise<WorkbenchSnapshot> {
  const store = new InMemoryResourceStore();
  const aiProvider = createMockAIProvider();
  const analyzer = new ResourceAnalyzer(aiProvider, store);
  const planner = new ActivationPlanner(aiProvider, store);
  const reviewEngine = new ReviewEngine(store);

  const github = store.createResource({
    userId,
    source: "github",
    title: "Agent workflow framework",
    url: "https://github.com/example/agent-workflow",
    content: "A toolkit for AI agent workflow orchestration, checkpoints, and memory-backed automation."
  });
  const xPost = store.createResource({
    userId,
    source: "x",
    title: "Thread about personal automation",
    url: "https://x.com/example/status/1",
    content: "A practical thread on turning saved links into product ideas and small automation workflows."
  });
  const link = store.createResource({
    userId,
    source: "link",
    title: "Resource activation product notes",
    url: "https://example.com/resource-activation",
    content: "Product design notes for classifying saved resources and turning them into action plans."
  });

  const drive = new DriveFolderConnector(store, {
    selectedRootFolderId: "drive-root",
    selectedRootName: "AI Resource Inbox"
  });
  await drive.sync(userId, [
    { id: "drive-root", name: "AI Resource Inbox", mimeType: "folder" },
    {
      id: "drive-file-1",
      parentId: "drive-root",
      name: "activation-research.md",
      mimeType: "text/markdown",
      content: "Research notes about resource activation, review loops, and user-owned automation."
    }
  ]);

  for (const resource of store.listResources(userId)) {
    await analyzer.analyze(userId, resource.id);
  }

  const goal = await planner.createGoalFromResources({
    userId,
    resourceIds: [github.id, xPost.id, link.id],
    intent: "把囤积的资源转成站内可执行的个人激活系统"
  });

  reviewEngine.recordReview({
    userId,
    resourceId: github.id,
    goalId: goal.id,
    outcome: "produced-output",
    actualValue: "high",
    reflection: "This resource became the first internal activation workflow."
  });

  const resources = store.listResources(userId);
  const analyses = store.listAnalyses(userId);
  const goals = store.listGoals(userId);
  const reviews = store.listReviews(userId);
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
      activeGoals: goals.filter((item) => item.status === "active").length,
      reviewedResources: reviews.length,
      averageValueScore
    }
  };
}
