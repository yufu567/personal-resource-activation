"use client";

import { Calendar, CheckCircle2, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";
import type { ResourceActivationSnapshot } from "@/server/resource-activation-service";

const valueLabels: Record<string, { zh: string; en: string }> = {
  high: { zh: "高价值", en: "High Value" },
  medium: { zh: "中等价值", en: "Medium" },
  low: { zh: "低价值", en: "Low Value" },
};

const outcomeLabels: Record<string, { zh: string; en: string }> = {
  "produced-output": { zh: "产出了具体成果", en: "Produced output" },
  learned: { zh: "学到了新东西", en: "Learned" },
  discarded: { zh: "确认不需要", en: "Discarded" },
  "needs-more-work": { zh: "还需要继续推进", en: "Needs more work" },
};

export function ReviewsPageClient({ snapshot }: { snapshot: ResourceActivationSnapshot }) {
  const { t, locale } = useI18n();

  if (snapshot.reviews.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t("reviews.eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("reviews.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("reviews.description")}</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("reviews.noReviews")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resourcesById = new Map(snapshot.resources.map((r) => [r.id, r]));

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          {t("reviews.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("reviews.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("reviews.description")}</p>
      </div>

      <div className="grid gap-4">
        {snapshot.reviews.map((review) => {
          const resource = resourcesById.get(review.resourceId);
          return (
            <Card key={review.id} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1 bg-muted" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {resource?.title ?? "Unknown"}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {review.reflection}
                    </CardDescription>
                  </div>
                  <Badge variant={review.actualValue === "high" ? "default" : review.actualValue === "medium" ? "secondary" : "destructive"}>
                    {valueLabels[review.actualValue]?.[locale] ?? review.actualValue}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {outcomeLabels[review.outcome]?.[locale] ?? review.outcome}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(review.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
                  </span>
                  {review.valueDelta !== 0 && (
                    <Badge variant={review.valueDelta > 0 ? "default" : "secondary"} className="text-[10px]">
                      {review.valueDelta > 0 ? "+" : ""}{review.valueDelta} {t("reviews.valueDelta")}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
