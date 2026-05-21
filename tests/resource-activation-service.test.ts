import { describe, expect, test } from "vitest";

import { createResourceActivationService } from "@/server/resource-activation-service";

describe("resource activation service", () => {
  test("adds a resource and analyzes it immediately", async () => {
    const service = createResourceActivationService();
    const result = await service.addResource({
      userId: "user-1",
      source: "link",
      title: "AI automation article",
      url: "https://example.com/ai-automation",
      content: "A practical article about AI workflow automation, product systems, and activation loops."
    });

    expect(result.resource.status).toBe("analyzed");
    expect(result.analysis.valueScore).toBeGreaterThanOrEqual(70);

    const snapshot = service.getSnapshot("user-1");
    expect(snapshot.metrics.totalResources).toBe(1);
    expect(snapshot.metrics.analyzedResources).toBe(1);
  });

  test("creates station-internal goals from analyzed resources", async () => {
    const service = createResourceActivationService();
    const result = await service.addResource({
      userId: "user-1",
      source: "github",
      title: "Workflow agent project",
      content: "An AI agent project for workflow orchestration and automation."
    });

    const goal = await service.createGoalFromResources({
      userId: "user-1",
      resourceIds: [result.resource.id],
      intent: "把这个项目转成个人资源激活原型"
    });

    expect(goal.tasks).toHaveLength(3);
    expect(goal.tasks.every((task) => task.permissionScope === "internal")).toBe(true);
    expect(service.getSnapshot("user-1").metrics.activeGoals).toBe(1);
  });

  test("seeds demo data only once", async () => {
    const service = createResourceActivationService();

    const first = await service.seedDemo("demo-user");
    const second = await service.seedDemo("demo-user");

    expect(first.metrics.totalResources).toBeGreaterThanOrEqual(4);
    expect(second.metrics.totalResources).toBe(first.metrics.totalResources);
    expect(second.goals[0]?.tasks.every((task) => task.permissionScope === "internal")).toBe(true);
  });

  test("seeds demo data even when a user added a resource first", async () => {
    const service = createResourceActivationService();
    await service.addResource({
      userId: "demo-user",
      source: "link",
      title: "Early resource",
      content: "A product automation note added before demo seeding."
    });

    const snapshot = await service.seedDemo("demo-user");

    expect(snapshot.resources.some((resource) => resource.title === "Early resource")).toBe(true);
    expect(snapshot.resources.some((resource) => resource.title === "Agent workflow framework")).toBe(true);
    expect(snapshot.metrics.totalResources).toBeGreaterThanOrEqual(5);
  });
});
