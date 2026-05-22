# Research Workflow — AI 调研

## 目标
根据 Plan 阶段提出的调研问题，AI 自动搜索并总结补充材料，充实激活链条。

## 输入
- Plan 输出的 researchQuestions
- 资源原文和领域 spec

## 处理步骤

### Step 1: 调研计划
- 将每个 researchQuestion 转化为搜索策略
- 确定搜索范围和优先级
- 输出给用户确认

### Step 2: 执行搜索（需用户授权）
- 调用搜索 API 获取相关结果
- 筛选高相关性内容（不采集低质量/广告/不可靠来源）
- 提取关键信息

### Step 3: 总结与关联
- 将搜索结果总结为 2-5 句核心要点
- 标注信息来源（URL）和可信度
- 关联到原始资源的缺口

### Step 4: 融入激活计划
- 将调研结果作为补充材料
- 更新激活计划中的相关信息
- 标注哪些缺口已被填补，哪些仍需用户提供

## 输出
```json
{
  "researchPlan": [
    {"question": "调研问题", "searchQuery": "搜索词", "rationale": "为什么搜这个"}
  ],
  "findings": [
    {
      "question": "对应的调研问题",
      "summary": "2-5 句中文总结",
      "sources": [{"title": "来源标题", "url": "https://..."}],
      "confidence": "high" | "medium" | "low",
      "gapsFilled": ["填补了哪个缺口"]
    }
  ],
  "unresolvedGaps": ["调研未能解决的缺口"]
}
```

## 安全约束
- 搜索词不包含用户个人信息
- 来源标注完整（title + url）
- 低质量来源标记为 low confidence
- 不采集付费墙后的内容
