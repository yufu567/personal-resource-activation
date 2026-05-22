"use client";

import { useCallback, useState, useTransition } from "react";
import { Download, FileUp, FolderSync, GitBranch, LinkIcon, Plug, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/context";
import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";

const connectors: {
  name: { zh: string; en: string };
  source: string;
  status: { zh: string; en: string };
  scope: { zh: string; en: string };
  icon: LucideIcon;
  connected: boolean;
}[] = [
  {
    name: { zh: "GitHub Star", en: "GitHub Stars" },
    source: "github",
    status: { zh: "真实 API", en: "Real API" },
    scope: { zh: "读取真实 GitHub Stars（需配置用户名）", en: "Real starred repos (username required)" },
    icon: GitBranch,
    connected: true,
  },
  {
    name: { zh: "X 收藏", en: "X Bookmarks" },
    source: "x",
    status: { zh: "Mock 已连接", en: "Mock Connected" },
    scope: { zh: "只读取示例收藏/点赞内容", en: "Mock bookmarks & likes" },
    icon: Plug,
    connected: true,
  },
  {
    name: { zh: "链接导入", en: "Link Import" },
    source: "link",
    status: { zh: "可用", en: "Available" },
    scope: { zh: "用户手动提交 URL 与备注", en: "Manual URL submission with notes" },
    icon: LinkIcon,
    connected: false,
  },
  {
    name: { zh: "上传文件", en: "File Upload" },
    source: "upload",
    status: { zh: "可用", en: "Available" },
    scope: { zh: "站内保存用户提供的文本线索", en: "Save user-provided text content" },
    icon: FileUp,
    connected: false,
  },
  {
    name: { zh: "网盘文件夹", en: "Drive Folder" },
    source: "drive",
    status: { zh: "Mock 已连接", en: "Mock Connected" },
    scope: { zh: "仅同步用户指定文件夹及子文件夹", en: "Sync selected folder and subfolders" },
    icon: FolderSync,
    connected: true,
  },
];

export function ConnectorsPageClient({ snapshot: initialSnapshot }: { snapshot: ResourceActivationSnapshot }) {
  const { t, locale } = useI18n();
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  // GitHub sync state
  const [ghUsername, setGhUsername] = useState("");
  const [ghToken, setGhToken] = useState("");
  const [ghPage, setGhPage] = useState(1);
  const [ghHasMore, setGhHasMore] = useState(false);
  const [ghMessage, setGhMessage] = useState("");
  const [ghPending, startGhSync] = useTransition();

  const syncGitHub = useCallback(() => {
    if (!ghUsername.trim()) return;
    setGhMessage("");
    startGhSync(async () => {
      const res = await fetch("/api/connectors/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ghUsername.trim(), token: ghToken.trim() || undefined, page: ghPage }),
      });
      const data = await res.json();
      if (data.error) {
        setGhMessage(data.error);
      } else {
        setSnapshot(data.snapshot);
        setGhHasMore(data.hasMore);
        setGhMessage(`已导入 ${data.imported} 个新资源（共发现 ${data.total} 个）`);
        if (data.hasMore) setGhPage(data.nextPage);
      }
    });
  }, [ghUsername, ghToken, ghPage]);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          {t("connectors.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("connectors.title")}</h1>
        <p className="text-sm text-muted-foreground max-w-prose">{t("connectors.description")}</p>
      </div>

      {/* GitHub Sync Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            GitHub Stars 同步
          </CardTitle>
          <CardDescription>
            输入 GitHub 用户名即可拉取公开的 Starred 仓库。提供 Token 可提升请求限额（60 → 5000 次/小时）并访问私有 Star。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>GitHub 用户名</Label>
              <Input
                value={ghUsername}
                onChange={(e) => setGhUsername(e.target.value)}
                placeholder="例如：vercel"
              />
            </div>
            <div className="space-y-2">
              <Label>Personal Access Token（可选）</Label>
              <Input
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="ghp_..."
              />
              <p className="text-[11px] text-muted-foreground">
                在 GitHub Settings → Developer settings → Personal access tokens 创建
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={syncGitHub} disabled={ghPending || !ghUsername.trim()}>
              {ghPending ? (
                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              同步 Stars
            </Button>
            {ghHasMore && (
              <Button variant="outline" onClick={syncGitHub} disabled={ghPending}>
                加载下一页
              </Button>
            )}
          </div>
          {ghMessage && (
            <p className={`text-sm ${ghMessage.includes("错误") || ghMessage.includes("限流") ? "text-destructive" : "text-muted-foreground"}`}>
              {ghMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Connector Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {connectors.map((connector) => {
          const Icon = connector.icon;
          const count = snapshot.resources.filter((r) => r.source === connector.source).length;

          return (
            <Card key={connector.source} className="group transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-accent transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{connector.name[locale]}</CardTitle>
                  </div>
                  <Badge variant={connector.connected ? "default" : "secondary"}>
                    {connector.status[locale]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">{connector.scope[locale]}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {t("connectors.imported")}{" "}
                    <strong className="text-foreground">{count}</strong>{" "}
                    {t("connectors.resources")}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
