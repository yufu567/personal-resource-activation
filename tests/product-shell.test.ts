import { describe, expect, test } from "vitest";

import { productNavigation } from "@/lib/navigation";
import { buildResourceRows } from "@/components/resources/resource-view-model";
import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";

describe("product shell information architecture", () => {
  test("exposes the launch-ready workspace routes in order", () => {
    expect(productNavigation.map((item) => item.href)).toEqual([
      "/resources",
      "/goals",
      "/reviews",
      "/connectors",
      "/settings"
    ]);

    expect(productNavigation.map((item) => item.label)).toEqual([
      "资源收件箱",
      "目标",
      "复盘",
      "连接器",
      "设置"
    ]);
  });
});

describe("resource view model", () => {
  test("maps resources and analyses into inbox rows with stable detail routes", () => {
    const snapshot: ResourceActivationSnapshot = {
      userId: "demo-user",
      resources: [
        {
          id: "res-1",
          userId: "demo-user",
          source: "github",
          title: "Agent workflow framework",
          url: "https://github.com/example/agent-workflow",
          content: "Workflow orchestration notes.",
          status: "analyzed",
          shareVisibility: "private",
          tags: ["agent"],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          id: "res-2",
          userId: "demo-user",
          source: "drive",
          title: "activation-research.md",
          content: "Research notes.",
          collectionPath: "AI Resource Inbox",
          status: "new",
          shareVisibility: "private",
          tags: [],
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z"
        }
      ],
      analyses: [
        {
          id: "analysis-1",
          userId: "demo-user",
          resourceId: "res-1",
          summary: "High-value framework for activation workflows.",
          category: "ai-workflow",
          tags: ["ai", "workflow"],
          valueScore: 86,
          recommendation: "activate",
          activationOpportunities: [
            {
              mode: "resource-driven",
              title: "Turn into implementation checklist",
              action: "Create internal goal",
              confidence: 0.82
            }
          ],
          gaps: ["Need implementation scope"],
          confidence: 0.82,
          nextBestAction: {
            title: "Activate as internal goal",
            description: "Turn this resource into a station-internal goal.",
            permissionScope: "internal"
          },
          reviewSuggestions: [],
          reasoning: "Relevant to product activation.",
          createdAt: "2026-01-01T00:01:00.000Z"
        }
      ],
      goals: [],
      reviews: [],
      metrics: {
        totalResources: 2,
        analyzedResources: 1,
        activeGoals: 0,
        reviewedResources: 0,
        averageValueScore: 86
      }
    };

    expect(buildResourceRows(snapshot)).toEqual([
      expect.objectContaining({
        id: "res-1",
        href: "/resources/res-1",
        sourceLabel: "GitHub Star",
        summary: "High-value framework for activation workflows.",
        score: 86,
        recommendationLabel: "建议激活",
        tags: ["ai", "workflow"]
      }),
      expect.objectContaining({
        id: "res-2",
        href: "/resources/res-2",
        sourceLabel: "网盘文件",
        summary: "等待 Mock AI 分析",
        score: 0,
        recommendationLabel: "待判断",
        tags: ["未标记"]
      })
    ]);
  });
});
