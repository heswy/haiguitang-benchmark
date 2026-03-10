# 🧪 海龟汤 Benchmark

AI 模型海龟汤游戏能力评测系统

> 🎮 本项目为 [海龟汤](https://www.magicheng.com) 游戏服务，用于评测各AI模型在海龟汤游戏中的表现
> 
> 📕 详情关注小红书：**魔法橙**

---

## 📊 最新测试结果

### 5模型 × 2提示词 × 100故事 横向评测

**综合排名（矩阵式）**

| 排名 | 模型 | v1 prompt | v2 prompt | 最佳得分 |
|:--:|:---|:---:|:---:|:---:|
| 🥇 | **DeepSeek-V3.2** | 82.6 | **89.0 ★** 🟢 | 89.0 |
| 🥈 | **GLM-4.7** | 83.0 🟢 | 83.4 ★ | 83.4 |
| 🥉 | **DeepSeek-V3.1-Terminus** | 76.4 | 83.2 ★ | 83.2 |
| 4 | **MiniMax-M2.5** | 78.1 | 81.2 ★ | 81.2 |
| 5 | **Kimi-K2.5** | 73.1 | 78.3 ★ | 78.3 |

> 🟢 绿色背景 = 该列最高分 | ★ = 该模型最佳配置

**详细指标对比**

| 模型 | Prompt | 一致性 | 帮助性 | 容忍度 | 误判(错/漏) |
|------|--------|--------|--------|--------|------------|
| DeepSeek-V3.2 | v1 | 80% | 57% | 88% | 1/0 |
| DeepSeek-V3.2 | v2 | 100% | 54% | 100% | 1/0 |
| GLM-4.7 | v1 | 100% | 48% | 78% | 0/1 |
| GLM-4.7 | v2 | 100% | 41% | 67% | 0/1 |
| Kimi-K2.5 | v1 | 73.1% | 45% | 80% | 4/0 |
| Kimi-K2.5 | v2 | 78.3% | 42% | 70% | 1/1 |

**关键发现**
- **v2 宽松版提示词**在所有模型上都表现更好（平均+5分）
- **DeepSeek-V3.2** 综合表现最佳，判定准确率高，容忍度满分
- **容忍度**差异显著：DeepSeek-V3.2(v2) 100% vs GLM-4.7(v2) 67%
- **一致性**：GLM-4.7 表现最稳定（100%），无逻辑矛盾

---

## 📋 项目概述

本基准测试系统用于评测不同 AI 模型在海龟汤（情境推理）游戏中的表现，包括：
- **问答准确性** - 对玩家问题的回答是否正确（是/不是/无关）
- **逻辑一致性** - 连续问答是否自相矛盾
- **答案判定** - 对玩家最终答案的评判是否准确、宽容
- **提示词对比** - 不同提示词模板对同一模型的影响

### 应用场景

专为 [海龟汤游戏平台](https://www.magicheng.com) 打造，用于：
- 选择最适合的 AI 模型作为游戏裁判
- 优化提示词模板以获得更好的游戏体验
- 持续监控模型性能变化

---

## 🗂️ 项目结构

```
haiguitang-benchmark/
├── dataset/                    # 测试数据集
│   ├── stories.json           # 100个标准海龟汤题目
│   ├── question-bank.json     # 标准提问库（1000+问题）
│   └── answer-tests.json      # 答案验证测试用例
├── models/
│   └── siliconflow.json       # 12个硅基流动模型配置
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
└── WORKLOG.md                  # 开发工作日志
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
git clone https://github.com/heswy/haiguitang-benchmark.git
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
# 默认测试（推荐）：6个故事 × 2个提示词
npm run dev

# 完整测试：100个故事 × 2个提示词 × 指定模型
npm run dev -- --models "Pro/deepseek-ai/DeepSeek-V3.2,Pro/zai-org/GLM-4.7" --yes

# 只测特定模型
npm run dev -- --models "Pro/deepseek-ai/DeepSeek-V3.2"

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

---

## 📊 测试数据集

### 故事分布（100个）

| 类别 | 数量 | 难度分布 |
|------|------|----------|
| 谋杀推理 | 30个 | hard: 14, medium: 10, easy: 6 |
| 意外事件 | 25个 | medium: 12, hard: 6, easy: 7 |
| 日常生活 | 25个 | easy: 10, medium: 11, hard: 4 |
| 幽默搞笑 | 20个 | easy: 9, medium: 7, hard: 4 |

### 代表性题目

1. **海龟汤的由来** - 经典心理/真相
2. **对赌汤** - 逻辑/牺牲
3. **餐厅自杀** - 谐音/绝望
4. **游泳池的悲剧** - 医学/意外
5. **床下的声音** - 恐怖/误导

---

## 🤖 支持模型（12个）

| 模型 | 类型 | 价格/1K tokens | 特点 |
|------|------|---------------|------|
| GLM-4.7 | Chat | ¥0.05 | 智谱旗舰，综合能力最强 |
| DeepSeek-V3.2 | Chat | ¥0.02 | 性能提升版，当前最佳 |
| DeepSeek-V3.1-Terminus | Chat | ¥0.02 | Terminus版本 |
| DeepSeek-V3 | Chat | ¥0.02 | 性价比首选 |
| DeepSeek-R1 | Reasoning | ¥0.04 | 思维链展示 |
| Kimi-K2.5 | Chat | ¥0.025 | 月之暗面，长文本强 |
| MiniMax-M2.5 | Chat | ¥0.025 | 国产大模型 |
| Qwen2.5-72B | Chat | ¥0.035 | 阿里通义千问 |
| Qwen2.5-7B | Chat | ¥0.005 | 轻量快速 |
| GLM-4-9B | Chat | ¥0.006 | GLM轻量版 |
| Llama-3.1-70B | Chat | ¥0.03 | Meta开源 |
| DeepSeek-V2.5 | Chat | ¥0.015 | 经济实惠 |

---

## 📈 评估指标

### 问答阶段
- **一致性** - 同一故事内回答是否逻辑自洽
- **帮助性** - 1 - 无关回答比例，反映对玩家推理的推进程度
- **准确率** - 回答「是/不是/无关」的正确率

### 答案验证阶段
- **判定准确度** - 判断玩家最终答案的正确率
- **容忍度** - 对同义表述的接受比例（如"吃了人肉"vs"食用尸体"）
- **误判(错/漏)** - 错误判对 / 正确判错的次数

---

## 📝 添加新测试用例

### 添加新故事

编辑 `dataset/stories.json`:

```json
{
  "id": 101,
  "title": "新故事",
  "scenario": "谜面...",
  "answer": "汤底...",
  "category": "类别",
  "difficulty": "medium"
}
```

---

## 🔧 开发计划

- [x] 基础框架
- [x] 100题数据集
- [x] 12模型支持
- [x] 矩阵式排名报告
- [x] 表格排序交互
- [ ] 批量历史对比
- [ ] 提示词自动优化
- [ ] CI/CD 集成

---

## 🔗 相关链接

- 🎮 **海龟汤游戏**: https://www.magicheng.com
- 📕 **小红书**: 魔法橙
- 🤖 **SiliconFlow**: https://cloud.siliconflow.cn/

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

## 📄 License

MIT
