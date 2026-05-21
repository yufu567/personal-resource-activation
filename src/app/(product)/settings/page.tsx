import { LockKeyhole, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const snapshot = await getResourceActivationService().seedDemo("demo-user");

  return (
    <div className="stacked-page">
      <PageHeader
        eyebrow="设置"
        title="默认私有、站内执行、Mock AI 优先"
        description="这些设置表达当前产品边界：不接真实 API，不泄露原始资源，不执行站外动作。"
      />

      <section className="settings-grid">
        <article className="workspace-panel settings-item">
          <ShieldCheck size={20} aria-hidden />
          <h3>AI Provider</h3>
          <p>当前使用 Mock AI Provider，所有分析、目标生成和复盘都在示例服务内完成。</p>
          <strong>Mock AI 已启用</strong>
        </article>
        <article className="workspace-panel settings-item">
          <LockKeyhole size={20} aria-hidden />
          <h3>资源可见性</h3>
          <p>资源默认私有，分享能力只预留摘要卡片，不暴露用户原始内容。</p>
          <strong>{snapshot.resources.filter((resource) => resource.shareVisibility === "private").length} 个私有资源</strong>
        </article>
        <article className="workspace-panel settings-item">
          <SlidersHorizontal size={20} aria-hidden />
          <h3>自动化边界</h3>
          <p>自动动作仅限站内：分类、目标、任务和复盘，不触发外部账号操作。</p>
          <strong>权限：internal</strong>
        </article>
      </section>
    </div>
  );
}
