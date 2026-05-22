"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { GitHubIcon } from "@/components/github-icon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function getPasswordStrength(pw: string): { label: string; color: string; score: number } {
  if (pw.length < 8) return { label: "太短", color: "bg-destructive", score: 1 };
  let score = 1;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "弱", color: "bg-destructive", score };
  if (score <= 3) return { label: "中等", color: "bg-amber-500", score };
  return { label: "强", color: "bg-green-500", score: 4 };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const strength = getPasswordStrength(password);

  function register(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (strength.score < 2) {
      setError("密码太弱，请使用更复杂的密码（至少 8 位，包含字母和数字）");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        await signIn("credentials", { email, password, redirect: false });
        router.push("/resources");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "注册失败");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle>注册</CardTitle>
        <CardDescription>创建你的资源激活账号</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {process.env.NEXT_PUBLIC_HAS_GITHUB === "1" && (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn("github", { callbackUrl: "/resources" })}
              disabled={pending}
            >
              <GitHubIcon />
              使用 GitHub 注册
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">或使用邮箱</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={register} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位，包含字母和数字"
              required
              minLength={8}
            />
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full ${
                        n <= strength.score ? strength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  密码强度：{strength.label}
                </p>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "注册中..." : "注册"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
