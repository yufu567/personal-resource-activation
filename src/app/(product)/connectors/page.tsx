import { GitBranch, LinkIcon, Plug, UploadCloud } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { getResourceActivationService } from "@/server/resource-activation-service";

const connectors = [
  {
    name: "GitHub Star",
    source: "github",
    status: "Mock 已连接",
    scope: "只读取示例 Star 资源",
    icon: GitBranch
  },
  {
    name: "X 收藏",
    source: "x",
    status: "Mock 已连接",
    scope: "只读取示例收藏/点赞内容",
    icon: Plug
  },
  {
    name: "链接导入",
    source: "link",
    status: "可用",
    scope: "用户手动提交 URL 与备注",
    icon: LinkIcon
  },
  {
    name: "上传文件",
    source: "upload",
    status: "可用",
    scope: "站内保存用户提供的文本线索",
    icon: UploadCloud
  },
  {
    name: "网盘文件",
    source: "drive",
    status: "Mock 已连接",
    scope: "仅同步用户指定文件夹及子文件夹",
    icon: Plug
  }
];

export const dynamic = "force-dynamic";

export default async function ConnectorsPage() {
  const snapshot = await getResourceActivationService().seedDemo("demo-user");

  return (
    <div className="stacked-page">
      <PageHeader
        eyebrow="连接器"
        title="统一管理资源入口和权限范围"
        description="当前仍使用 Mock 数据源，不接真实第三方 API；连接器页面只展示产品信息架构与安全边界。"
      />

      <section className="connector-grid">
        {connectors.map((connector) => {
          const Icon = connector.icon;
          const count = snapshot.resources.filter((resource) => resource.source === connector.source).length;

          return (
            <article className="workspace-panel connector-item" key={connector.name}>
              <div className="connector-icon">
                <Icon size={20} aria-hidden />
              </div>
              <div>
                <h3>{connector.name}</h3>
                <p>{connector.scope}</p>
              </div>
              <dl>
                <div>
                  <dt>状态</dt>
                  <dd>{connector.status}</dd>
                </div>
                <div>
                  <dt>资源数</dt>
                  <dd>{count}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>
    </div>
  );
}
