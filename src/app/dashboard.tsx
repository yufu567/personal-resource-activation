"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  CheckCircle2,
  Cloud,
  FileText,
  LinkIcon,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Upload
} from "lucide-react";

import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";
import type { AnalysisRecord, Resource, ResourceSource } from "@/core/types";

type DashboardProps = {
  initialSnapshot: ResourceActivationSnapshot;
};

const sourceLabels: Record<ResourceSource, string> = {
  github: "GitHub Star",
  x: "X 收藏/点赞",
  upload: "上传文件",
  link: "链接导入",
  drive: "网盘文件夹"
};

export function Dashboard({ initialSnapshot }: DashboardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedSource, setSelectedSource] = useState<ResourceSource | "all">("all");
  const [form, setForm] = useState({
    source: "link" as ResourceSource,
    title: "",
    url: "",
    content: ""
  });
  const [status, setStatus] = useState("Mock AI 已启用，所有动作都限制在站内。");
  const [isPending, startTransition] = useTransition();

  const analysesByResource = useMemo(() => {
    return new Map(snapshot.analyses.map((analysis) => [analysis.resourceId, analysis]));
  }, [snapshot.analyses]);

  const filteredResources =
    selectedSource === "all"
      ? snapshot.resources
      : snapshot.resources.filter((resource) => resource.source === selectedSource);

  function refresh() {
    startTransition(async () => {
      const response = await fetch("/api/resources");
      setSnapshot(await response.json());
      setStatus("已刷新资源激活台。");
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
          intent: `把「${resource.title}」转成一个可执行的站内目标`
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
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal Resource Activation</p>
          <h1>个人资源激活台</h1>
        </div>
        <button className="icon-button" type="button" onClick={refresh} disabled={isPending} aria-label="刷新">
          <RefreshCw size={18} />
          <span>刷新</span>
        </button>
      </header>

      <section className="metrics-grid" aria-label="资源激活指标">
        <Metric label="资源总数" value={snapshot.metrics.totalResources} icon={<FileText size={20} />} />
        <Metric label="已分析" value={snapshot.metrics.analyzedResources} icon={<Sparkles size={20} />} />
        <Metric label="激活目标" value={snapshot.metrics.activeGoals} icon={<Target size={20} />} />
        <Metric label="平均价值分" value={snapshot.metrics.averageValueScore} icon={<ListChecks size={20} />} />
      </section>

      <div className="workspace-grid">
        <aside className="side-panel">
          <section className="panel">
            <div className="section-title">
              <Upload size={18} />
              <h2>添加资源</h2>
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
                  <option value="x">X 收藏/点赞</option>
                  <option value="upload">上传文件</option>
                  <option value="drive">网盘文件夹</option>
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
                <Sparkles size={18} />
                <span>添加并分析</span>
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="section-title">
              <ShieldCheck size={18} />
              <h2>权限边界</h2>
            </div>
            <ul className="plain-list">
              <li>Mock AI Provider，暂不调用真实 API。</li>
              <li>自动动作仅限站内：分类、目标、任务、复盘。</li>
              <li>资源默认私有，分享能力只预留摘要卡片。</li>
              <li>网盘只同步用户指定文件夹及子文件夹。</li>
            </ul>
          </section>
        </aside>

        <section className="main-panel">
          <div className="toolbar">
            <div className="section-title">
              <Cloud size={18} />
              <h2>资源流</h2>
            </div>
            <div className="segmented" aria-label="资源来源筛选">
              {(["all", "github", "x", "link", "upload", "drive"] as const).map((source) => (
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
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                analysis={analysesByResource.get(resource.id)}
                onCreateGoal={createGoal}
                onReview={review}
                disabled={isPending}
              />
            ))}
          </div>
        </section>

        <aside className="side-panel">
          <section className="panel">
            <div className="section-title">
              <Target size={18} />
              <h2>站内目标</h2>
            </div>
            <div className="goal-list">
              {snapshot.goals.map((goal) => (
                <article className="compact-card" key={goal.id}>
                  <strong>{goal.title}</strong>
                  <p>{goal.intent}</p>
                  <span>{goal.tasks.length} 个任务 · {goal.checkpoints.length} 个检查点</span>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-title">
              <CheckCircle2 size={18} />
              <h2>复盘记录</h2>
            </div>
            <div className="goal-list">
              {snapshot.reviews.map((reviewLog) => (
                <article className="compact-card" key={reviewLog.id}>
                  <strong>{reviewLog.actualValue.toUpperCase()}</strong>
                  <p>{reviewLog.reflection}</p>
                  <span>{reviewLog.outcome}</span>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <p className="status-line" role="status">
        {isPending ? "处理中..." : status}
      </p>
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ResourceCard({
  resource,
  analysis,
  onCreateGoal,
  onReview,
  disabled
}: {
  resource: Resource;
  analysis?: AnalysisRecord;
  onCreateGoal: (resource: Resource) => void;
  onReview: (resource: Resource) => void;
  disabled: boolean;
}) {
  return (
    <article className="resource-card">
      <div className="resource-header">
        <div>
          <span className={`source-pill source-${resource.source}`}>{sourceLabels[resource.source]}</span>
          <h3>{resource.title}</h3>
        </div>
        <strong className="score">{analysis?.valueScore ?? 0}</strong>
      </div>

      <p>{analysis?.summary ?? "等待分析"}</p>

      <div className="tag-row">
        {(analysis?.tags ?? resource.tags).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
        <span>{resource.status}</span>
        <span>{resource.shareVisibility}</span>
      </div>

      <div className="opportunity-row">
        <Archive size={16} />
        <span>{analysis?.recommendation === "archive" ? "保留留痕，暂不激活" : "可转成站内行动目标"}</span>
      </div>

      {analysis?.gaps.length ? <p className="gap-text">缺口：{analysis.gaps.join(" / ")}</p> : null}

      <div className="button-row">
        {resource.url ? (
          <a className="secondary-button" href={resource.url} target="_blank" rel="noreferrer">
            <LinkIcon size={16} />
            <span>原链接</span>
          </a>
        ) : null}
        <button className="secondary-button" type="button" onClick={() => onCreateGoal(resource)} disabled={disabled}>
          <Target size={16} />
          <span>转目标</span>
        </button>
        <button className="secondary-button" type="button" onClick={() => onReview(resource)} disabled={disabled}>
          <CheckCircle2 size={16} />
          <span>复盘</span>
        </button>
      </div>
    </article>
  );
}
