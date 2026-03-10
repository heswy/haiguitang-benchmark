# 海龟汤 Benchmark 项目工作日志

## 2026-03-10

### ✅ 已完成的工作

#### 1. 项目初始化与修复
- [x] 安装依赖 `npm install`
- [x] 配置 `.env` 和 `.gitignore`（API Key 安全保护）
- [x] 修复编译错误（`costPer1KTokens` 属性名不匹配）
- [x] 修复运行时错误（`import.meta.url` 路径空格编码问题）
- [x] 修复数据文件 JSON 错误（中文引号未转义）

#### 2. 数据集替换
- [x] 替换 `dataset/stories.json`：30个 → **100个故事**
- [x] 生成 `dataset/question-bank.json`：**1000个问题**（每故事10个）
- [x] 生成 `dataset/answer-tests.json`：**500个测试用例**

#### 3. Bug 修复
| Bug | 修复方式 |
|-----|---------|
| 模型名被截断 | 分隔符从 `-` 改为 `::` |
| 提示词不影响结果 | 答案验证阶段使用 `prompt.systemPrompt` 而非硬编码 |

#### 4. 数据格式
**stories.json** (100个故事)
```json
{
  "id": 1,
  "title": "海龟汤的由来",
  "scenario": "谜面...",
  "answer": "汤底...",
  "category": "谋杀推理|意外事件|日常生活|幽默搞笑",
  "difficulty": "easy|medium|hard"
}
```

**question-bank.json** (1000个问题)
- 类型：distractor, direct, clue, trap, creative, process
- 期望答案：是 / 不是 / 无关

**answer-tests.json** (500个测试用例)
- 每个故事5个测试用例
- 判定：correct / close / wrong

### ⚠️ 已知问题
1. **API 响应慢**：DeepSeek-V3 在 SiliconFlow 上响应时间较长，容易超时
2. **指标显示为0%**：当测试数据量太小时，部分指标计算异常（需要增加测试样本）

### 📝 待办事项
- [ ] 优化问题库质量（当前为自动生成，需人工校准）
- [ ] 增加更多模型配置
- [ ] 优化报告展示（特别是指标为0%的情况）
- [ ] 添加测试并发控制和重试机制
- [ ] 完整跑一遍基准测试（100故事 × 多模型）

### 🔧 常用命令
```bash
# 快速测试（3故事 × 3问题）
npm run dev -- --yes --models "Pro/deepseek-ai/DeepSeek-V3" --max-questions 3 --stories "1,2,3"

# 生成报告
npm run report

# 完整测试（耗时较长）
npm run dev -- --yes
```

### 💡 项目状态
**当前可运行**，但建议：
1. 使用更快的模型（如 Qwen2.5-72B）进行测试
2. 或增加超时时间 `REQUEST_TIMEOUT=60000`
3. 问题库已自动生成，但可能需要人工优化期望答案的准确性

---
**最后更新**: 2026-03-10 17:25
