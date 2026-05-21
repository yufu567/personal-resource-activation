"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">页面加载出错</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "发生了意外错误，请重试。"}
            </p>
          </div>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            重试
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
