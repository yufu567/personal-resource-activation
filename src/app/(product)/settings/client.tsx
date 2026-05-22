"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Cpu, Key, LinkIcon, Lock, SlidersHorizontal, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useI18n } from "@/i18n/context";
import type { AIConfig } from "@/ai/config";
import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";

export function SettingsPageClient({ snapshot }: { snapshot: ResourceActivationSnapshot }) {
  const { t } = useI18n();

  // AI Config state
  const [aiConfig, setAIConfig] = useState<AIConfig>({ provider: "mock" });
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configPending, startSave] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        setAIConfig(data.config ?? { provider: "mock" });
        setConfigLoaded(true);
      });
  }, []);

  function saveConfig() {
    startSave(async () => {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiConfig),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  const providerLabel = { mock: "Mock AI", openai: "OpenAI / Compatible", anthropic: "Anthropic" };
  const showApiConfig = aiConfig.provider !== "mock";

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          {t("settings.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground max-w-prose">{t("settings.description")}</p>
      </div>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            AI Provider 配置
          </CardTitle>
          <CardDescription>
            选择 AI 服务商并填入你自己的 API Key。支持 OpenAI、Anthropic 及所有 OpenAI 兼容接口。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={aiConfig.provider}
                onValueChange={(v) =>
                  setAIConfig((prev) => ({ ...prev, provider: v as AIConfig["provider"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock AI（关键词匹配）</SelectItem>
                  <SelectItem value="openai">OpenAI / 兼容接口</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showApiConfig && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  API Key
                </Label>
                <Input
                  type="password"
                  value={aiConfig.apiKey ?? ""}
                  onChange={(e) => setAIConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                />
              </div>
            )}
          </div>

          {showApiConfig && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Base URL（可选）
                </Label>
                <Input
                  value={aiConfig.baseUrl ?? ""}
                  onChange={(e) => setAIConfig((prev) => ({ ...prev, baseUrl: e.target.value || undefined }))}
                  placeholder={aiConfig.provider === "openai" ? "https://api.openai.com/v1" : ""}
                />
                <p className="text-[11px] text-muted-foreground">
                  留空使用默认。可填 DeepSeek、Groq 等兼容地址。
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  Model
                </Label>
                <Input
                  value={aiConfig.model ?? ""}
                  onChange={(e) => setAIConfig((prev) => ({ ...prev, model: e.target.value || undefined }))}
                  placeholder={aiConfig.provider === "openai" ? "gpt-4o" : "claude-sonnet-4-20250514"}
                />
                <p className="text-[11px] text-muted-foreground">留空使用默认模型。</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={saveConfig} disabled={configPending}>
              {saved ? <Check className="h-4 w-4 mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
              {saved ? "已保存" : "保存配置"}
            </Button>
            {!configLoaded && (
              <span className="text-xs text-muted-foreground">加载中...</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other settings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardTitle className="text-base">{t("settings.visibility")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("settings.visibilityDesc")}</p>
            <Badge variant="secondary">
              {snapshot.resources.filter((r) => r.shareVisibility === "private").length}
              {t("settings.privateResource")}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardTitle className="text-base">{t("settings.automation")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("settings.automationDesc")}</p>
            <Badge variant="outline">Permission: internal</Badge>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("settings.systemMetrics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { label: t("resources.metrics.total"), value: snapshot.metrics.totalResources },
                { label: t("resources.metrics.analyzed"), value: snapshot.metrics.analyzedResources },
                { label: t("resources.metrics.activeGoals"), value: snapshot.metrics.activeGoals },
                { label: t("resources.metrics.avgScore"), value: snapshot.metrics.averageValueScore },
              ].map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs text-muted-foreground">{metric.label}</dt>
                  <dd className="text-2xl font-semibold">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("settings.deployInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t("settings.version")}：local</p>
            <p>{t("settings.env")}：Development</p>
            <p>{t("settings.dbMode")}：{t("settings.dbMemory")}</p>
            <p>{t("settings.cache")}：{t("settings.redisOff")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
