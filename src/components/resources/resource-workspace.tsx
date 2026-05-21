"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  Folder,
  ListFilter,
  Plus,
  RefreshCw,
  Sparkles,
  Target
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";
import type { Resource, ResourceSource } from "@/core/types";
import { buildResourceRows, sourceLabels, type ResourceRow } from "./resource-view-model";

type ResourceWorkspaceProps = {
  initialSnapshot: ResourceActivationSnapshot;
  initialSelectedResourceId?: string;
};

const sourceFilters: Array<ResourceSource | "all"> = ["all", "github", "x", "link", "upload", "drive"];

export function ResourceWorkspace({ initialSnapshot, initialSelectedResourceId }: ResourceWorkspaceProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedSource, setSelectedSource] = useState<ResourceSource | "all">("all");
  const [selectedResourceId, setSelectedResourceId] = useState(initialSelectedResourceId);
  const [form, setForm] = useState({
    source: "link" as ResourceSource,
    title: "",
    url: "",
    content: ""
  });
  const [status, setStatus] = useState("Mock AI 已启用，所有动作都限制在站内。");
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => buildResourceRows(snapshot), [snapshot]);
  const filteredRows =
    selectedSource === "all" ? rows : rows.filter((row) => row.source === selectedSource);
  const selectedRow = rows.find((row) => row.id === selectedResourceId) ?? rows[0];

  function refresh() {
    startTransition(async () => {
      const response = await fetch("/api/resources");
      setSnapshot(await response.json());
      setStatus("已刷新资源收件箱。");
    });
  }

  function addResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      setSnapshot(payload.snapshot);
      setSelectedResourceId(payload.resource.id);
      setForm({ source: "link", title: "", url: "", content: "" });
      setStatus(`已添加并分析资源：${payload.resource.title}`);
    });
  }

  function createGoal(resource: Resource) {
    startTransition(async () => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceIds: [resource.id],
          intent: `把「${resource.title}」转成一个站内可执行目标`
        })
      });
      const payload = await response.json();
      setSnapshot(payload.snapshot);
      setStatus(`已创建目标：${payload.goal.title}`);
    });
  }

  function review(resource: Resource) {
    startTransition(async () => {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: resource.id,
          outcome: "learned",
          actualValue: "medium",
          reflection: `已完成对「${resource.title}」的站内复盘。`
        })
      });
      const payload = await response.json();
      setSnapshot(payload.snapshot);
      setStatus(`已记录复盘：${resource.title}`);
    });
  }

  return (
    <div className="resource-workspace">
      <PageHeader
        eyebrow="资源收件箱"
        title="优先处理最可能变成行动的资源"
        description="保留现有 Mock AI / API 行为，资源会在添加后自动分析，并可继续转成目标或复盘。"
        actions={
          <button className="icon-button" type="button" onClick={refresh} disabled={isPending}>
            <RefreshCw size={16} aria-hidden />
            刷新
          </button>
        }
      />

      <section className="metrics-grid" aria-label="资源激活指标">
        <Metric label="资源总数" value={snapshot.metrics.totalResources} />
        <Metric label="已分析" value={snapshot.metrics.analyzedResources} />
        <Metric label="激活目标" value={snapshot.metrics.activeGoals} />
        <Metric label="平均价值分" value={snapshot.metrics.averageValueScore} />
      </section>

      <div className="resource-layout">
        <section className="workspace-panel add-resource-panel" aria-labelledby="add-resource-title">
          <div className="panel-heading">
            <Plus size={18} aria-hidden />
            <h3 id="add-resource-title">添加资源</h3>
          </div>

          <form className="resource-form" onSubmit={addResource}>
            <label>
              来源
              <select
                value={form.source}
                onChange={(event) => setForm((current) => ({ ...current, source: event.target.value as ResourceSource }))}
              >
                <option value="link">链接导入</option>
                <option value="github">GitHub Star</option>
                <option value="x">X 收藏</option>
                <option value="upload">上传文件</option>
                <option value="drive">网盘文件</option>
              </select>
            </label>
            <label>
              标题
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="例如：AI 工作流实践"
                required
              />
            </label>
            <label>
              链接
              <input
                value={form.url}
                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://example.com"
              />
            </label>
            <label>
              内容线索
              <textarea
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                placeholder="粘贴摘要、备注或你记得的上下文"
                rows={5}
              />
            </label>
            <button className="primary-button" type="submit" disabled={isPending}>
              <Sparkles size={16} aria-hidden />
              添加并分析
            </button>
          </form>
        </section>

        <section className="workspace-panel inbox-panel" aria-labelledby="resource-list-title">
          <div className="panel-heading toolbar-heading">
            <span>
              <ListFilter size={18} aria-hidden />
              <h3 id="resource-list-title">资源流</h3>
            </span>
            <div className="segmented" aria-label="资源来源筛选">
              {sourceFilters.map((source) => (
                <button
                  key={source}
                  type="button"
                  className={selectedSource === source ? "active" : ""}
                  onClick={() => setSelectedSource(source)}
                >
                  {source === "all" ? "全部" : sourceLabels[source]}
                </button>
              ))}
            </div>
          </div>

          <div className="resource-list">
            {filteredRows.map((row) => (
              <ResourceListRow
                key={row.id}
                row={row}
                selected={selectedRow?.id === row.id}
                onSelect={() => setSelectedResourceId(row.id)}
              />
            ))}
          </div>
        </section>

        <ResourceDetailPanel
          row={selectedRow}
          disabled={isPending}
          onCreateGoal={createGoal}
          onReview={review}
        />
      </div>

      <p className="status-line" role="status">
        {isPending ? "处理中..." : status}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ResourceListRow({
  row,
  selected,
  onSelect
}: {
  row: ResourceRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={selected ? "resource-row active" : "resource-row"}>
      <Link href={row.href} onClick={onSelect}>
        <div className="resource-row-main">
          <span className={`source-pill source-${row.source}`}>{row.sourceLabel}</span>
          <h4>{row.title}</h4>
          <p>{row.summary}</p>
        </div>
        <div className="resource-row-meta">
          <strong>{row.score}</strong>
          <span>{row.recommendationLabel}</span>
        </div>
      </Link>
    </article>
  );
}

function ResourceDetailPanel({
  row,
  disabled,
  onCreateGoal,
  onReview
}: {
  row?: ResourceRow;
  disabled: boolean;
  onCreateGoal: (resource: Resource) => void;
  onReview: (resource: Resource) => void;
}) {
  if (!row) {
    return (
      <aside className="workspace-panel detail-panel">
        <div className="empty-state">
          <Archive size={24} aria-hidden />
          <h3>还没有资源</h3>
          <p>添加第一个资源后，Mock AI 会在这里展示分析结果。</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="workspace-panel detail-panel" aria-labelledby="resource-detail-title">
      <div className="detail-kicker">
        <span className={`source-pill source-${row.source}`}>{row.sourceLabel}</span>
        <span>{row.statusLabel}</span>
      </div>
      <h3 id="resource-detail-title">{row.title}</h3>
      <p className="detail-summary">{row.summary}</p>

      <div className="score-strip">
        <span>价值分</span>
        <strong>{row.score}</strong>
        <span>{row.recommendationLabel}</span>
      </div>

      <div className="tag-row">
        {row.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      {row.collectionPath ? (
        <p className="meta-line">
          <Folder size={15} aria-hidden />
          {row.collectionPath}
        </p>
      ) : null}

      {row.analysis?.activationOpportunities.length ? (
        <section className="detail-section">
          <h4>激活机会</h4>
          {row.analysis.activationOpportunities.map((opportunity) => (
            <div className="opportunity-item" key={`${opportunity.mode}-${opportunity.title}`}>
              <strong>{opportunity.title}</strong>
              <p>{opportunity.action}</p>
            </div>
          ))}
        </section>
      ) : null}

      {row.analysis?.gaps.length ? (
        <section className="detail-section">
          <h4>缺口</h4>
          <ul className="plain-list">
            {row.analysis.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="button-row">
        {row.url ? (
          <a className="secondary-button" href={row.url} target="_blank" rel="noreferrer">
            <ExternalLink size={15} aria-hidden />
            原链接
          </a>
        ) : null}
        <button className="secondary-button" type="button" onClick={() => onCreateGoal(row.resource)} disabled={disabled}>
          <Target size={15} aria-hidden />
          转目标
        </button>
        <button className="secondary-button" type="button" onClick={() => onReview(row.resource)} disabled={disabled}>
          <CheckCircle2 size={15} aria-hidden />
          复盘
        </button>
      </div>
    </aside>
  );
}
