/**
 * Spec Loader — 从文件系统加载 AI 规范并编译为 context。
 *
 * 使用方式：
 *   const spec = loadSpec("engineering"); // 加载指定领域的完整 context
 *   const globalSpec = loadGlobalSpec();  // 只加载 constitution + domain index
 *
 * 在生产环境中，spec 文件可以被缓存。在开发环境中，每次请求都可以重新加载。
 */

import fs from "fs";
import path from "path";

const SPEC_DIR = path.join(process.cwd(), "src/ai/spec");

let cache: { mtime: number; content: string } | null = null;

function readSpecFile(relativePath: string): string {
  const filePath = path.join(SPEC_DIR, relativePath);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return `<!-- Spec file not found: ${relativePath} -->`;
  }
}

export interface SpecContext {
  /** Complete AI context string ready to inject into system prompt */
  systemPrompt: string;
  /** Individual sections for structured use */
  sections: {
    constitution: string;
    domainIndex: string;
    domainSpec: string;
    workflows: Record<string, string>;
    patterns: string;
  };
  /** Which domain spec was loaded */
  domain: string;
}

const WORKFLOW_FILES = ["intake", "evaluate", "plan", "research", "reflect"] as const;

export function loadSpec(domain = "general"): SpecContext {
  const constitution = readSpecFile("constitution.md");
  const domainIndex = readSpecFile("domains/index.md");
  const domainSpec = readSpecFile(`domains/${domain}.md`);
  const patterns = readSpecFile("memory/patterns.md");

  const workflows: Record<string, string> = {};
  for (const name of WORKFLOW_FILES) {
    workflows[name] = readSpecFile(`workflows/${name}.md`);
  }

  const sections = { constitution, domainIndex, domainSpec, workflows, patterns };

  const systemPrompt = compileSpecContext(sections, domain);

  return { systemPrompt, sections, domain };
}

export function loadGlobalSpec(): SpecContext {
  return loadSpec("general");
}

function compileSpecContext(
  sections: SpecContext["sections"],
  domain: string,
): string {
  const { constitution, domainIndex, domainSpec, workflows, patterns } = sections;

  return [
    "---",
    "## 系统规范 (System Spec)",
    "以下规范定义了你的行为边界、分析视角和工作流程。你必须严格遵守。",
    "",
    "### 核心宪章 (Constitution)",
    constitution,
    "",
    "### 领域分类 (Domain Index)",
    domainIndex,
    "",
    `### 当前领域 (Active Domain: ${domain})`,
    domainSpec || "（使用通用视角）",
    "",
    "### 激活模式记忆 (Patterns)",
    patterns,
    "",
    "### 工作流规范 (Workflows)",
    "你必须在对应步骤中参考以下工作流规范：",
    ...Object.entries(workflows).flatMap(([name, content]) => [
      `#### ${name}`,
      content || "(未定义)",
      "",
    ]),
    "---",
    "现在开始执行你的任务。记住：你是分析引擎，不是执行者。所有行动建议必须在站内完成。",
  ].join("\n");
}

// In-memory reload for dev — call when spec files change
export function clearSpecCache() {
  cache = null;
}
