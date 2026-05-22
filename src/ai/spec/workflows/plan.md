# Plan Workflow — 激活计划

## 目标
将评估通过的资源转化为可执行的目标和任务。

## 输入
- Evaluate 输出（评分 + 缺口 + 激活角度）
- 资源的领域 spec（domains/*.md）
- 用户意图（intent，可能为空）

## 处理步骤

### Step 1: 目标定义
根据资源内容和用户意图，定义一个可度量、可完成的目标。
- 目标要有明确的"完成标准"
- 目标拆分为 2-3 个阶段
- 每个阶段有 checkpoint

### Step 2: 任务分解
每个阶段拆解为 2-4 个具体任务：
- 每个任务有标题、描述、优先级
- 任务必须可以在站内完成
- 高优先级任务是"不做就无法前进"的

### Step 3: 调研问题
列出需要补充的信息，AI 可以在 RESEARCH 步骤中去调研：
- 明确搜索什么关键词
- 期望找到什么类型的信息
- 找到后如何用于激活

### Step 4: 补充材料
建议用户自己准备的材料（AI 不能代劳的）：
- 用户的个人经验和判断
- 需要用户自己验证的假设
- 需要用户访问的私有数据

## 输出
```json
{
  "goalTitle": "目标标题",
  "successCriteria": "怎样算完成这个目标",
  "phases": [
    {"id": "p1", "title": "阶段名", "objective": "做什么", "checkpoint": "完成标准"}
  ],
  "tasks": [
    {"id": "t1", "phaseId": "p1", "title": "任务名", "how": "怎么做", "priority": "high"}
  ],
  "researchQuestions": [
    {"query": "搜索关键词", "purpose": "为什么需要", "expectedType": "期望找到什么"}
  ],
  "supplementalMaterials": [
    {"title": "材料名", "reason": "为什么需要", "sourceHint": "manual-note"}
  ]
}
```

## Gate
- 目标没有"完成标准" → 退回重做
- 所有任务都是 low priority → 检查是否过度拆分
