# 🧪 海龟汤 Benchmark

AI 模型海龟汤游戏能力评测系统 - 专为 haiguitang 项目打造

## 📋 项目概述

本基准测试系统用于评测不同 AI 模型在海龟汤游戏中的表现，包括：
- **问答准确性** - 对玩家问题的回答是否正确
- **逻辑一致性** - 连续问答是否自相矛盾
- **答案判定** - 对玩家最终答案的评判是否准确宽松
- **成本效益** - 性能与成本的平衡

## 🗂️ 项目结构

```
haiguitang-benchmark/
├── dataset/                    # 测试数据集
│   ├── stories.json           # 30个标准海龟汤题目
│   ├── question-bank.json     # 标准提问库（150+问题）
│   └── answer-tests.json      # 答案验证测试用例
├── models/
│   └── siliconflow.json       # 8个硅基流动模型配置
├── prompts/                    # 提示词变体
│   ├── v1-strict.txt         # 严格版
│   ├── v2-lenient.txt        # 宽松版
│   └── v3-cot.txt            # 思维链版
├── src/
│   ├── runners/
│   │   └── benchmark.ts      # 测试执行引擎
│   ├── evaluators/
│   │   └── evaluator.ts      # 结果评估器
│   ├── reporters/
│   │   └── html-reporter.ts  # 可视化报告生成
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   ├── utils/
│   │   ├── api.ts            # SiliconFlow API 封装
│   │   └── logger.ts         # 日志工具
│   └── index.ts              # CLI 入口
├── results/                    # 测试结果输出（gitignore）
└── public/                     # 网页报告资源
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd haiguitang-benchmark
npm install
```

### 2. 配置 API Key

```bash
cp .env.example .env
# 编辑 .env，填入你的 SILICON_FLOW_API_KEY
```

获取 API Key: https://cloud.siliconflow.cn/

### 3. 运行测试

```bash
# 默认测试（推荐）：6个故事 × 2个提示词 × GLM-4.7
npm run dev

# 完整测试（费用较高）：30个故事 × 3个提示词 × 8个模型
npm run dev -- --models "Pro/zai-org/GLM-4.7,Pro/deepseek-ai/DeepSeek-V3" --stories "1,2,3,4,5" --yes

# 只测特定模型
npm run dev -- --models "Pro/deepseek-ai/DeepSeek-V3"

# 调整每故事问题数
npm run dev -- --max-questions 10
```

### 4. 生成报告

```bash
# 从最新结果生成 HTML 报告
npm run report

# 从指定结果文件生成
npm run report -- results/benchmark-xxx.json
```

## 📊 测试数据集

### 故事难度分布

| 难度 | 数量 | 特征 |
|------|------|------|
| Easy | 6个 | 单一线索，直接推理 |
| Medium | 12个 | 2-3个转折 |
| Hard | 8个 | 非常规思维 |
| Extreme | 4个 | 多重反转 |

### 代表性题目

1. **游泳池的悲剧** - 医学/意外
2. **经典海龟汤** - 心理/真相
3. **床下的声音** - 恐怖/误导
4. **床底的秘密 (Extreme)** - 视角/逻辑陷阱
5. **镜子的谎言 (Extreme)** - 精神分裂/自我认知

## 🤖 支持模型

| 模型 | 类型 | 价格/1K tokens | 推荐场景 |
|------|------|---------------|---------|
| GLM-4.7 | Chat | ¥0.05 | 综合能力最强 |
| DeepSeek-V3 | Chat | ¥0.02 | 性价比首选 |
| DeepSeek-R1 | Reasoning | ¥0.04 | 需要思维链 |
| Qwen2.5-72B | Chat | ¥0.035 | 长文本处理 |
| Qwen2.5-7B | Chat | ¥0.005 | 快速测试 |

## 📈 评估指标

### 问答阶段 (40%)
- **Accuracy** - 回答正确率
- **Consistency** - 逻辑一致性
- **Helpfulness** - 推理推进度

### 答案验证阶段 (40%)
- **Validation Accuracy** - 判定准确度
- **Tolerance** - 同义表述容忍度
- **False Pos/Neg** - 误判次数

### 效率 (20%)
- **Latency** - 平均响应时间
- **Cost** - 平均成本

## 💰 费用估算

```
每次测试 ≈ 模型数 × 提示词数 × 故事数 × (问题数 + 答案测试数)

示例：
- 2 模型 × 2 提示词 × 6 故事 × 8 调用 = 192 次 API 调用
- 按 ¥0.02/1K tokens，平均 500 tokens/次
- 费用 ≈ 192 × 0.0005 × 0.02 = ¥0.002（几乎可以忽略）
```

**完整测试（8模型×3提示词×30故事）**:
- 约 4000+ 次调用
- 费用约 ¥0.5-2（取决于模型选择）

## 📝 添加新测试用例

### 添加新故事

编辑 `dataset/stories.json`:

```json
{
  "id": 31,
  "title": "新故事",
  "scenario": "谜面...",
  "answer": "汤底...",
  "category": "类别",
  "difficulty": "medium",
  "tags": ["标签1", "标签2"]
}
```

### 添加问题

编辑 `dataset/question-bank.json`:

```json
{
  "id": "s31-q01",
  "storyId": 31,
  "question": "问题内容",
  "expected": "是",
  "type": "direct",
  "reason": "为什么是这个答案"
}
```

### 添加答案测试

编辑 `dataset/answer-tests.json`:

```json
{
  "storyId": 31,
  "truth": "汤底...",
  "cases": [
    {
      "answer": "玩家答案",
      "expect": "correct",
      "reason": "为什么应该判对"
    }
  ]
}
```

## 🔧 开发计划

- [x] 基础框架
- [x] 30题数据集
- [x] 8模型支持
- [x] HTML 报告
- [ ] 批量历史对比
- [ ] 提示词自动优化
- [ ] CI/CD 集成

## 📄 License

MIT
