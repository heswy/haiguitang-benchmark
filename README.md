# 🧪 海龟汤 Benchmark

AI 模型海龟汤游戏能力评测系统

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 SILICON_FLOW_API_KEY

# 3. 运行测试
npm run dev

# 4. 生成报告
npm run report
```

## 项目结构

```
haiguitang-benchmark/
├── dataset/           # 测试数据集
├── models/            # 模型配置
├── prompts/           # 提示词模板
├── src/
│   ├── runners/       # 测试执行器
│   ├── evaluators/    # 结果评估器
│   ├── reporters/     # 报告生成器
│   └── utils/         # 工具函数
├── results/           # 测试结果
└── public/            # 网页报告资源
```

## 数据集

- 30 个标准海龟汤题目
- 每个题目 10-15 个标准提问
- 难度分级：Easy / Medium / Hard / Extreme

## 评估维度

1. **Accuracy** - 回答准确率
2. **Consistency** - 逻辑一致性
3. **Helpfulness** - 推理推进度
4. **Validation Accuracy** - 答案判定准确度
5. **Cost Efficiency** - 成本效益

## License

MIT
