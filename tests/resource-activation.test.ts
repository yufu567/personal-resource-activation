import { describe, expect, test } from "vitest";

import { createMockAIProvider } from "@/ai/mock-provider";
import { DriveFolderConnector } from "@/connectors/drive-folder-connector";
import { ActivationPlanner } from "@/core/activation-planner";
import { createDemoWorkbench } from "@/core/demo-workbench";
import { ResourceAnalyzer } from "@/core/resource-analyzer";
import { InMemoryResourceStore } from "@/core/resource-store";
import { ReviewEngine } from "@/core/review-engine";

describe("personal resource activation", () => {
  test("mock provider separates basic analysis from value assessment", async () => {
    const store = new InMemoryResourceStore();
    const resource = store.createResource({
      userId: "user-1",
      source: "github",
      title: "Agent workflow evaluation kit",
      content: "AI agent workflow notes with model evaluation, checkpoints, and automation patterns."
    });
    const ai = createMockAIProvider();

    const basic = await ai.analyzeResource({ resource });

    expect(basic.summary).toContain("Agent workflow");
    expect(basic.category).toBe("ai-workflow");
    expect(basic.confidence).toBeGreaterThan(0.7);
    expect("valueScore" in basic).toBe(false);

    const assessment = await ai.evaluateResourceValue({ resource, basicAnalysis: basic });

    expect(assessment.valueScore).toBeGreaterThanOrEqual(80);
    expect(assessment.recommendation).toBe("activate");
    expect(assessment.nextBestAction.permissionScope).toBe("internal");
    expect(assessment.nextBestAction.title).toMatch(/activate/i);
  });

  test("analyzes every resource and records an audit trail", async () => {
    const store = new InMemoryResourceStore();
    const analyzer = new ResourceAnalyzer(createMockAIProvider(), store);
    const resource = store.createResource({
      userId: "user-1",
      source: "github",
      title: "LangGraph orchestration toolkit",
      url: "https://github.com/langchain-ai/langgraph",
      content:
        "A framework for building stateful agent workflows with checkpoints, memory, and graph-based orchestration."
    });

    const analysis = await analyzer.analyze("user-1", resource.id);

    expect(analysis.summary).toContain("LangGraph");
    expect(analysis.category).toBe("ai-workflow");
    expect(analysis.valueScore).toBeGreaterThanOrEqual(70);
    expect(analysis.confidence).toBeGreaterThan(0.7);
    expect(analysis.tags).toContain("ai");
    expect(analysis.nextBestAction.permissionScope).toBe("internal");
    expect(analysis.nextBestAction.description).toContain("goal");
    expect(analysis.activationOpportunities[0]?.mode).toBe("resource-driven");
    expect(analysis.gaps.length).toBeGreaterThan(0);
    expect(store.getAuditEvents("user-1", resource.id).map((event) => event.type)).toContain(
      "analysis.completed"
    );
  });

  test("keeps low-value resources traceable instead of dropping them", async () => {
    const store = new InMemoryResourceStore();
    const analyzer = new ResourceAnalyzer(createMockAIProvider(), store);
    const resource = store.createResource({
      userId: "user-1",
      source: "upload",
      title: "Weekend screenshot",
      content: "A small visual note without reusable context, links, or actionable details."
    });

    const analysis = await analyzer.analyze("user-1", resource.id);

    expect(analysis.summary.length).toBeGreaterThan(10);
    expect(analysis.category).toBe("low-signal");
    expect(analysis.valueScore).toBeLessThan(50);
    expect(analysis.recommendation).toBe("archive");
    expect(analysis.nextBestAction.title).toMatch(/archive|enrich/i);
    expect(analysis.activationOpportunities[0]?.mode).toBe("review-driven");
    expect(store.getResource("user-1", resource.id)?.status).toBe("analyzed");
  });

  test("turns resources into internal goals with tasks and checkpoints", async () => {
    const store = new InMemoryResourceStore();
    const ai = createMockAIProvider();
    const analyzer = new ResourceAnalyzer(ai, store);
    const planner = new ActivationPlanner(ai, store);
    const resource = store.createResource({
      userId: "user-1",
      source: "link",
      title: "Personal automation design notes",
      url: "https://example.com/automation",
      content:
        "Ideas about collecting saved resources, classifying them, and turning promising material into concrete personal workflows."
    });

    await analyzer.analyze("user-1", resource.id);
    const goal = await planner.createGoalFromResources({
      userId: "user-1",
      resourceIds: [resource.id],
      intent: "把收藏资源转成一个能执行的自动化系统"
    });

    expect(goal.status).toBe("active");
    expect(goal.tasks.length).toBeGreaterThanOrEqual(3);
    expect(goal.phases.length).toBeGreaterThanOrEqual(3);
    expect(goal.checkpoints.length).toBeGreaterThanOrEqual(2);
    expect(goal.tasks.every((task) => task.permissionScope === "internal")).toBe(true);
    expect(goal.gaps.length).toBeGreaterThan(0);
    expect(goal.resourceGaps.length).toBeGreaterThanOrEqual(2);
    expect(goal.supplementalMaterials.length).toBeGreaterThanOrEqual(2);
    expect(goal.supplementalMaterials.map((material) => material.title)).toContain("User context note");
    expect(goal.tasks.some((task) => task.title.toLowerCase().includes("missing"))).toBe(true);
    expect(store.getAuditEvents("user-1", resource.id).map((event) => event.type)).toContain(
      "goal.created"
    );
  });

  test("records actual resource value and review suggestions after action", async () => {
    const store = new InMemoryResourceStore();
    const ai = createMockAIProvider();
    const analyzer = new ResourceAnalyzer(ai, store);
    const reviewEngine = new ReviewEngine(store, ai);
    const userOneResource = store.createResource({
      userId: "user-1",
      source: "x",
      title: "Useful thread",
      content: "A thread with practical steps for prototyping a product."
    });
    store.createResource({
      userId: "user-2",
      source: "github",
      title: "Other user's star",
      content: "Private to another user."
    });
    await analyzer.analyze("user-1", userOneResource.id);

    const review = await reviewEngine.recordReview({
      userId: "user-1",
      resourceId: userOneResource.id,
      outcome: "produced-output",
      actualValue: "high",
      reflection: "This resource led to a working prototype task list."
    });

    expect(review.lifecycleStage).toBe("reviewed");
    expect(review.reviewSuggestions.length).toBeGreaterThan(0);
    expect(review.suggestedNextStep).toContain("internal");
    expect(store.getResource("user-1", userOneResource.id)?.status).toBe("reviewed");
    expect(store.getResource("user-1", userOneResource.id)?.actualValue).toBe("high");
    expect(store.getAnalysis("user-1", userOneResource.id)?.actualValue).toBe("high");
    expect(store.listResources("user-1")).toHaveLength(1);
    expect(store.listResources("user-1")[0]?.shareVisibility).toBe("private");
  });

  test("syncs only a selected drive folder and its descendants", async () => {
    const store = new InMemoryResourceStore();
    const connector = new DriveFolderConnector(store, {
      selectedRootFolderId: "folder-root",
      selectedRootName: "AI Resource Inbox"
    });

    const imported = await connector.sync("user-1", [
      { id: "folder-root", name: "AI Resource Inbox", mimeType: "folder" },
      {
        id: "file-a",
        parentId: "folder-root",
        name: "agent report.pdf",
        mimeType: "application/pdf",
        content: "Report about agent product patterns."
      },
      { id: "folder-child", parentId: "folder-root", name: "research", mimeType: "folder" },
      {
        id: "file-b",
        parentId: "folder-child",
        name: "market notes.md",
        mimeType: "text/markdown",
        content: "Market notes for resource activation tools."
      },
      {
        id: "file-outside",
        parentId: "unselected-folder",
        name: "private finance.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        content: "Outside the selected folder."
      }
    ]);

    expect(imported.map((resource) => resource.title)).toEqual(["agent report.pdf", "market notes.md"]);
    expect(imported[1]?.collectionPath).toBe("AI Resource Inbox/research");
    expect(store.listResources("user-1")).toHaveLength(2);
  });

  test("builds a demo workbench snapshot for the web experience", async () => {
    const snapshot = await createDemoWorkbench();

    expect(snapshot.metrics.totalResources).toBeGreaterThanOrEqual(4);
    expect(snapshot.metrics.analyzedResources).toBe(snapshot.resources.length);
    expect(snapshot.goals[0]?.tasks.every((task) => task.permissionScope === "internal")).toBe(true);
    expect(snapshot.resources.every((resource) => resource.shareVisibility === "private")).toBe(true);
  });
});
