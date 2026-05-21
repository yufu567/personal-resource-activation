import { CheckCircle2, CircleDashed, Target } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const snapshot = await getResourceActivationService().seedDemo("demo-user");

  return (
    <div className="stacked-page">
      <PageHeader
        eyebrow="目标"
        title="把高价值资源推进到可执行任务"
        description="目标仍由 Mock AI 生成，任务权限固定为站内，不会触发外部自动化。"
      />

      <section className="workspace-panel">
        <div className="panel-heading">
          <Target size={18} aria-hidden />
          <h3>活跃目标</h3>
        </div>
        <div className="goal-table">
          {snapshot.goals.map((goal) => (
            <article className="goal-row" key={goal.id}>
              <div>
                <h4>{goal.title}</h4>
                <p>{goal.intent}</p>
              </div>
              <dl>
                <div>
                  <dt>任务</dt>
                  <dd>{goal.tasks.length}</dd>
                </div>
                <div>
                  <dt>检查点</dt>
                  <dd>{goal.checkpoints.length}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{goal.status}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <CircleDashed size={18} aria-hidden />
          <h3>任务明细</h3>
        </div>
        <div className="task-grid">
          {snapshot.goals.flatMap((goal) =>
            goal.tasks.map((task) => (
              <article className="task-item" key={task.id}>
                <span className={`priority priority-${task.priority}`}>{task.priority}</span>
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <small>
                  <CheckCircle2 size={14} aria-hidden />
                  权限：{task.permissionScope}
                </small>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
