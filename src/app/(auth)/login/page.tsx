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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("邮箱或密码错误");
      } else {
        router.push("/resources");
        router.refresh();
      }
    });
  }

  function loginWithGitHub() {
    startTransition(async () => {
      await signIn("github", { callbackUrl: "/resources" });
    });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle>登录</CardTitle>
        <CardDescription>登录你的资源激活系统</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {process.env.NEXT_PUBLIC_HAS_GITHUB === "1" && (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={loginWithGitHub}
              disabled={pending}
            >
              <GitHubIcon />
              使用 GitHub 登录
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

        <form onSubmit={login} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <Link href="/reset-password" className="text-xs text-muted-foreground hover:underline">
                忘记密码？
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              minLength={4}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "登录中..." : "登录"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          演示账号：demo@example.com / demo123
        </p>
      </CardContent>
    </Card>
  );
}
