import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";
import type { AnalysisRecord, Resource, ResourceSource, ResourceStatus } from "@/core/types";

export type ResourceRow = {
  id: string;
  href: string;
  title: string;
  source: ResourceSource;
  sourceLabel: string;
  statusLabel: string;
  summary: string;
  score: number;
  recommendationLabel: string;
  tags: string[];
  collectionPath?: string;
  url?: string;
  createdAt: string;
  resource: Resource;
  analysis?: AnalysisRecord;
};

export const sourceLabels: Record<ResourceSource, string> = {
  github: "GitHub Star",
  x: "X 收藏",
  upload: "上传文件",
  link: "链接导入",
  drive: "网盘文件"
};

const statusLabels: Record<ResourceStatus, string> = {
  new: "待分析",
  analyzed: "已分析",
  reviewed: "已复盘",
  archived: "已归档"
};

const recommendationLabels: Record<AnalysisRecord["recommendation"], string> = {
  activate: "建议激活",
  review: "建议复盘",
  archive: "建议归档"
};

export function buildResourceRows(snapshot: ResourceActivationSnapshot): ResourceRow[] {
  const analysesByResource = new Map(snapshot.analyses.map((analysis) => [analysis.resourceId, analysis]));

  return snapshot.resources.map((resource) => {
    const analysis = analysesByResource.get(resource.id);
    const tags = analysis?.tags.length ? analysis.tags : resource.tags;

    return {
      id: resource.id,
      href: `/resources/${resource.id}`,
      title: resource.title,
      source: resource.source,
      sourceLabel: sourceLabels[resource.source],
      statusLabel: statusLabels[resource.status],
      summary: analysis?.summary ?? "等待 Mock AI 分析",
      score: analysis?.valueScore ?? 0,
      recommendationLabel: analysis ? recommendationLabels[analysis.recommendation] : "待判断",
      tags: tags.length ? tags : ["未标记"],
      collectionPath: resource.collectionPath,
      url: resource.url,
      createdAt: resource.createdAt,
      resource,
      analysis
    };
  });
}

export function findResourceRow(snapshot: ResourceActivationSnapshot, resourceId: string) {
  return buildResourceRows(snapshot).find((row) => row.id === resourceId);
}
