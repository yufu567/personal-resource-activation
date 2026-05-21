import { CheckCircle2, ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  const resourcesById = new Map(snapshot.resources.map((resource) => [resource.id, resource]));

  return (
    <div className="stacked-page">
      <PageHeader
        eyebrow="复盘"
        title="确认资源是否真的产生价值"
        description="复盘记录会回写资源生命周期，帮助收件箱从“收藏”进入“行动后判断”。"
      />

      <section className="workspace-panel">
        <div className="panel-heading">
          <ClipboardCheck size={18} aria-hidden />
          <h3>复盘记录</h3>
        </div>

        <div className="review-timeline">
          {snapshot.reviews.map((review) => {
            const resource = resourcesById.get(review.resourceId);

            return (
              <article className="review-item" key={review.id}>
                <span className={`value-badge value-${review.actualValue}`}>{review.actualValue}</span>
                <div>
                  <h4>{resource?.title ?? "未知资源"}</h4>
                  <p>{review.reflection}</p>
                  <small>
                    <CheckCircle2 size={14} aria-hidden />
                    {review.outcome} · {review.lifecycleStage}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
