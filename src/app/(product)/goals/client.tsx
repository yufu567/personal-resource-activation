"use client";

import { CheckCircle2, CircleDashed, Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/context";
import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";

const statusLabels: Record<string, { zh: string; en: string }> = {
  active: { zh: "进行中", en: "Active" },
  completed: { zh: "已完成", en: "Completed" },
  paused: { zh: "已暂停", en: "Paused" },
};

export function GoalsPageClient({ snapshot }: { snapshot: ResourceActivationSnapshot }) {
  const { t, locale } = useI18n();

  if (snapshot.goals.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t("goals.eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("goals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("goals.description")}</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Flag className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("goals.noGoals")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          {t("goals.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("goals.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("goals.description")}</p>
      </div>

      <div className="grid gap-6">
        {snapshot.goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <CardDescription>{goal.intent}</CardDescription>
                </div>
                <Badge variant={goal.status === "active" ? "default" : goal.status === "completed" ? "secondary" : "outline"}>
                  {statusLabels[goal.status]?.[locale] ?? goal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {goal.tasks.length}{t("goals.tasks")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Flag className="h-4 w-4" />
                  {goal.checkpoints.length}{t("goals.checkpoints")}
                </span>
              </div>

              {goal.tasks.length > 0 && (
                <>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2">
                    {goal.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{task.title}</span>
                            <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} className="text-[10px]">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("goals.permission")}：{task.permissionScope}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
