# Reflect Workflow — 复盘与沉淀

## 目标
用户完成激活后，评估资源是否真的产生了价值，并将经验沉淀到系统中。

## 输入
- 用户的复盘记录（outcome、actualValue、reflection）
- 原始资源和分析记录
- 该领域的历史复盘数据（来自 memory/patterns.md）

## 处理步骤

### Step 1: 价值确认
- 对比用户的实际产出和 AI 的初始评估
- 计算价值偏差（AI 预期 vs 用户实际）
- 如果偏差大，分析原因

### Step 2: 模式提炼
- 这次激活中有什么可复用的经验？
- 有没有可以形成模板的做法？
- 领域 spec 是否需要更新？

### Step 3: 下一步建议
- 基于复盘结果，建议后续行动
- 关联到其他可能受益的资源
- 建议是否更新 memory/patterns.md

## 输出
```json
{
  "valueDelta": 15,
  "reviewSuggestions": [
    {"title": "建议标题", "action": "具体行动", "priority": "high"}
  ],
  "suggestedNextStep": "一句话",
  "patternUpdates": [
    {
      "file": "memory/patterns.md",
      "section": "engineering",
      "suggestedContent": "## 新发现的模式\n...",
      "rationale": "为什么建议添加"
    }
  ],
  "specSuggestions": [
    {
      "file": "domains/engineering.md",
      "change": "在激活模式中添加 '模式 D：...'",
      "rationale": "基于用户成功案例"
    }
  ]
}
```

## Gate
- 复盘必须产生至少一条可操作的建议
- 如果 actualValue 与 AI 评估差距 > 30 分，标记为需要人工复核
- pattern 和 spec 建议需要用户批准
