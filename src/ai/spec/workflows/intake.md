# Intake Workflow — 资源收件

## 目标
理解一个刚进入系统的资源：它是什么、讲什么、属于哪个领域。

## 输入
- 资源元信息（title、source、url）
- 资源内容（content，可能为空）
- 用户提供的 context（tags、collectionPath 等）

## 处理步骤

### Step 1: 内容理解
- 如果有完整内容：通读并提取核心主题
- 如果只有标题和 URL：基于标题和来源做初步推断，标注 confidence 更低
- 如果内容为空：输出 "内容不足，需要用户补充"

### Step 2: 领域判断
- 根据 domains/index.md 的领域分类，选择最匹配的主领域
- 如果有明显的次级领域特征，在 tags 中标注
- 资源可能属于多个领域时，选"最能产生激活价值"的那个

### Step 3: 质量初判
- 内容是否完整？
- 来源是否可信？
- 是否有过时风险（技术类 > 2 年、金融类 > 1 月）

## 输出
```json
{
  "summary": "一句话总结（中文）",
  "domain": "工程/技术",
  "domainKey": "engineering",
  "medium": "text",
  "tags": ["ai", "agent", "workflow"],
  "qualityFlag": "good" | "incomplete" | "outdated" | "unclear",
  "confidence": 0.85,
  "needsUserInput": false
}
```

## Gate
- confidence < 0.5 → 要求用户补充上下文
- qualityFlag === "unclear" → 降低后续步骤的优先级
