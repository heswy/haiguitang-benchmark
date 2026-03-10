// 核心类型定义

export interface Story {
  id: number;
  title: string;
  scenario: string;  // 谜面
  answer: string;    // 汤底
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  tags?: string[];
}

export interface Question {
  id: string;
  storyId: number;
  question: string;
  expected: '是' | '不是' | '无关';
  type: 'direct' | 'clue' | 'distractor' | 'process' | 'trap' | 'creative';
  reason: string;  // 为什么是这个答案
}

export interface AnswerTestCase {
  storyId: number;
  answer: string;
  expect: 'correct' | 'close' | 'wrong';
  reason: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'siliconflow' | 'openai' | 'other';
  type: 'chat' | 'reasoning';
  costPer1KTokens: number;
  maxTokens: number;
  description?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  version: string;
}

export interface TestResult {
  modelId: string;
  promptId: string;
  storyId: number;
  questionId?: string;
  question?: string;
  expected?: string;
  actual: string;
  correct: boolean;
  latency: number;
  tokensUsed?: number;
  cost?: number;
  timestamp: string;
  rawResponse?: string;
}

export interface ValidationResult {
  modelId: string;
  promptId: string;
  storyId: number;
  answer: string;
  expected: 'correct' | 'close' | 'wrong';
  actual: 'correct' | 'close' | 'wrong';
  isCorrect: boolean;  // 判定是否准确
  latency: number;
  timestamp: string;
}

export interface ModelScore {
  modelId: string;
  promptId: string;
  // 问答阶段
  qaAccuracy: number;      // 回答正确率
  qaConsistency: number;   // 逻辑一致性
  qaHelpfulness: number;   // 推理推进度
  qaSafety: number;        // 防诱导能力
  // 答案验证阶段
  valAccuracy: number;     // 判定准确度
  valTolerance: number;    // 同义容忍度
  valFalsePos: number;     // 错误判对次数
  valFalseNeg: number;     // 正确判错次数
  // 效率
  avgLatency: number;      // 平均响应时间
  avgCost: number;         // 平均成本
  totalCost: number;       // 总成本
  // 综合
  overallScore: number;    // 综合得分
}

export interface BenchmarkReport {
  id: string;
  name: string;
  timestamp: string;
  duration: number;
  config: {
    models: string[];
    prompts: string[];
    stories: number[];
  };
  scores: ModelScore[];
  results: TestResult[];
  validations: ValidationResult[];
}
