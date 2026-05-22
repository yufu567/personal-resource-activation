"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  FileText,
  Folder,
  Layers,
  Lightbulb,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/context";
import type { Resource, ResourceSource } from "@/core/types";
import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";
import { buildResourceRows, sourceLabels, type ResourceRow } from "./resource-view-model";

type ResourceWorkspaceProps = {
  initialSnapshot: ResourceActivationSnapshot;
  initialSelectedResourceId?: string;
};

const sourceFilters: Array<ResourceSource | "all"> = [
  "all",
  "github",
  "x",
  "link",
  "upload",
  "drive",
];

export function ResourceWorkspace({
  initialSnapshot,
  initialSelectedResourceId,
}: ResourceWorkspaceProps) {
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedSource, setSelectedSource] = useState<ResourceSource | "all">("all");
  const [selectedResourceId, setSelectedResourceId] = useState(initialSelectedResourceId);
  const [form, setForm] = useState({
    source: "link" as ResourceSource,
    title: "",
    url: "",
    content: "",
  });
  const [status, setStatus] = useState(t("common.status"));
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => buildResourceRows(snapshot), [snapshot]);
  const filteredRows =
    selectedSource === "all" ? rows : rows.filter((row) => row.source === selectedSource);
  const selectedRow = rows.find((row) => row.id === selectedResourceId) ?? rows[0];

  function refresh() {
    startTransition(async () => {
      const response = await fetch("/api/resources");
      setSnapshot(await response.json());
      setStatus(t("common.refreshed"));
    });
  }

  function addResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      setSnapshot(payload.snapshot);
      setSelectedResourceId(payload.resource.id);
      setForm({ source: "link", title: "", url: "", content: "" });
      setStatus(t("common.added") + payload.resource.title);
    });
  }

  function createGoal(resource: Resource) {
    startTransition(async () => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceIds: [resource.id],
          intent: `把「${resource.title}」转成一个站内可执行目标`,
        }),
      });
      const payload = await response.json();
      setSnapshot(payload.snapshot);
      setStatus(t("common.goalCreated") + payload.goal.title);
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
          reflection: `已完成对「${resource.title}」的站内复盘。`,
        }),
      });
      const payload = await response.json();
      setSnapshot(payload.snapshot);
      setStatus(t("common.reviewed") + resource.title);
    });
  }

  const metrics = [
    { label: t("resources.metrics.total"), value: snapshot.metrics.totalResources, icon: Layers },
    { label: t("resources.metrics.analyzed"), value: snapshot.metrics.analyzedResources, icon: Sparkles },
    { label: t("resources.metrics.activeGoals"), value: snapshot.metrics.activeGoals, icon: Target },
    { label: t("resources.metrics.avgScore"), value: snapshot.metrics.averageValueScore, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t("resources.eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("resources.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("resources.description")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isPending}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          {t("resources.refresh")}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-xl font-semibold">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Three-column Layout */}
      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr_340px] xl:grid-cols-[320px_1fr_360px]">
        {/* Left: Add Resource Form */}
        <Card className="lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              {t("resources.addResource")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addResource} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("resources.source")}</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, source: v as ResourceSource }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">{sourceLabels.link}</SelectItem>
                    <SelectItem value="github">{sourceLabels.github}</SelectItem>
                    <SelectItem value="x">{sourceLabels.x}</SelectItem>
                    <SelectItem value="upload">{sourceLabels.upload}</SelectItem>
                    <SelectItem value="drive">{sourceLabels.drive}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">{t("resources.title_field")}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t("resources.titlePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">{t("resources.url")}</Label>
                <Input
                  id="url"
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder={t("resources.urlPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">{t("resources.content")}</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={t("resources.contentPlaceholder")}
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                <Sparkles className="h-4 w-4 mr-1.5" />
                {t("resources.addButton")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Center: Resource List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                {t("resources.resourceStream")}
              </CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {sourceFilters.map((source) => (
                  <Badge
                    key={source}
                    variant={selectedSource === source ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => setSelectedSource(source)}
                  >
                    {source === "all" ? t("resources.all") : sourceLabels[source]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-20rem)] space-y-2 overflow-auto">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Archive className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("resources.noMatch")}</p>
              </div>
            ) : (
              filteredRows.map((row) => (
                <ResourceListRow
                  key={row.id}
                  row={row}
                  selected={selectedRow?.id === row.id}
                  onSelect={() => setSelectedResourceId(row.id)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Resource Detail */}
        <ResourceDetailPanel
          row={selectedRow}
          disabled={isPending}
          onCreateGoal={createGoal}
          onReview={review}
        />
      </div>

      {/* Status Bar */}
      <div className="sticky bottom-4 flex justify-center">
        <Badge variant="secondary" className="px-4 py-2 text-xs shadow-lg">
          {isPending ? t("common.loading") : status}
        </Badge>
      </div>
    </div>
  );
}

function ResourceListRow({
  row,
  selected,
  onSelect,
}: {
  row: ResourceRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Link href={row.href} onClick={onSelect}>
      <div
        className={`group rounded-lg border p-3 transition-colors hover:bg-accent ${
          selected ? "border-primary/50 bg-accent" : "border-transparent"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {row.sourceLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">{row.statusLabel}</span>
            </div>
            <h4 className="mb-1 truncate text-sm font-medium">{row.title}</h4>
            <p className="line-clamp-2 text-xs text-muted-foreground">{row.summary}</p>
            {row.tags.length > 0 && row.tags[0] !== "未标记" && (
              <div className="mt-2 flex flex-wrap gap-1">
                {row.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-lg font-semibold">{row.score}</span>
            <span className="text-[10px] text-muted-foreground">{row.recommendationLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ResourceDetailPanel({
  row,
  disabled,
  onCreateGoal,
  onReview,
}: {
  row?: ResourceRow;
  disabled: boolean;
  onCreateGoal: (resource: Resource) => void;
  onReview: (resource: Resource) => void;
}) {
  const { t } = useI18n();

  if (!row) {
    return (
      <Card className="lg:sticky lg:top-20">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Archive className="h-10 w-10 text-muted-foreground/30" />
          <div className="space-y-1">
            <h3 className="text-sm font-medium">{t("resources.noResources")}</h3>
            <p className="text-sm text-muted-foreground">{t("resources.noResourcesDesc")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:sticky lg:top-20">
      <CardHeader className="pb-3">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {row.sourceLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">{row.statusLabel}</span>
        </div>
        <CardTitle className="text-lg leading-snug">{row.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{row.summary}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-lg font-semibold">
            {row.score}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("resources.valueScore")}</p>
            <Badge variant="outline" className="text-[10px]">
              {row.recommendationLabel}
            </Badge>
          </div>
        </div>

        {row.tags.length > 0 && row.tags[0] !== "未标记" && (
          <div className="flex flex-wrap gap-1.5">
            {row.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}

        {row.collectionPath && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Folder className="h-3.5 w-3.5" />
            {row.collectionPath}
          </p>
        )}

        {row.analysis?.activationOpportunities.length ? (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" />
              {t("resources.activationOpportunity")}
            </h4>
            <div className="space-y-2">
              {row.analysis.activationOpportunities.map((op) => (
                <div key={`${op.mode}-${op.title}`} className="rounded-lg border p-2.5">
                  <p className="text-sm font-medium">{op.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{op.action}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {row.analysis?.gaps.length ? (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("resources.gaps")}
            </h4>
            <ul className="space-y-1.5">
              {row.analysis.gaps.map((gap) => (
                <li key={gap} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Separator />

        <div className="flex flex-wrap gap-2">
          {row.url && (
            <Button variant="outline" size="sm" asChild>
              <a href={row.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                {t("resources.sourceLink")}
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onCreateGoal(row.resource)} disabled={disabled}>
            <Target className="h-3.5 w-3.5 mr-1" />
            {t("resources.toGoal")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReview(row.resource)} disabled={disabled}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {t("resources.review")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
