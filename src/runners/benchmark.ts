import { Story, Question, AnswerTestCase, ModelConfig, PromptTemplate, TestResult, ValidationResult } from '../types/index.js';
import { SiliconFlowAPI } from '../utils/api.js';
import { Logger } from '../utils/logger.js';
import { Evaluator } from '../evaluators/evaluator.js';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger('Benchmark');

export interface BenchmarkConfig {
  models: string[];
  prompts: string[];
  stories: number[];
  delayMs: number;
  timeout: number;
  maxQuestionsPerStory: number;
}

export class BenchmarkRunner {
  private api: SiliconFlowAPI;
  private evaluator: Evaluator;
  private stories: Story[] = [];
  private questions: Question[] = [];
  private answerTests: { storyId: number; truth: string; cases: any[] }[] = [];
  private models: ModelConfig[] = [];
  private prompts: PromptTemplate[] = [];
  private results: TestResult[] = [];
  private validations: ValidationResult[] = [];

  constructor(apiKey: string, baseUrl: string, delayMs: number = 500) {
    this.api = new SiliconFlowAPI(apiKey, baseUrl, delayMs);
    this.evaluator = new Evaluator();
  }

  async loadData() {
    logger.info('加载测试数据...');

    // 加载故事
    const storiesData = await fs.readFile(
      path.join(process.cwd(), 'dataset/stories.json'),
      'utf-8'
    );
    this.stories = JSON.parse(storiesData);

    // 加载问题库
    const questionsData = await fs.readFile(
      path.join(process.cwd(), 'dataset/question-bank.json'),
      'utf-8'
    );
    this.questions = JSON.parse(questionsData).questions;

    // 加载答案测试
    const answerTestsData = await fs.readFile(
      path.join(process.cwd(), 'dataset/answer-tests.json'),
      'utf-8'
    );
    this.answerTests = JSON.parse(answerTestsData).tests;

    // 加载模型配置
    const modelsData = await fs.readFile(
      path.join(process.cwd(), 'models/siliconflow.json'),
      'utf-8'
    );
    this.models = JSON.parse(modelsData).models;

    // 加载提示词
    await this.loadPrompts();

    logger.success(`加载完成: ${this.stories.length} 个故事, ${this.questions.length} 个问题, ${this.models.length} 个模型`);
  }

  private async loadPrompts() {
    const promptFiles = ['v1-strict.txt', 'v2-lenient.txt', 'v3-cot.txt'];
    const promptNames = ['严格版', '宽松版', '思维链'];
    
    for (let i = 0; i < promptFiles.length; i++) {
      const content = await fs.readFile(
        path.join(process.cwd(), 'prompts', promptFiles[i]),
        'utf-8'
      );
      this.prompts.push({
        id: `v${i + 1}`,
        name: promptNames[i],
        systemPrompt: content,
        userPromptTemplate: '{context}\n\n玩家问题: {question}',
        version: `v${i + 1}.0`
      });
    }
  }

  async run(config: BenchmarkConfig) {
    const startTime = Date.now();
    logger.info('开始基准测试...');
    logger.info(`配置: ${config.models.length} 模型 × ${config.prompts.length} 提示词 × ${config.stories.length} 故事`);

    // 过滤要测试的模型和故事
    const testModels = this.models.filter(m => config.models.includes(m.id));
    const testStories = this.stories.filter(s => config.stories.includes(s.id));
    const testPrompts = this.prompts.filter(p => config.prompts.includes(p.id));

    let totalTasks = 0;
    let completedTasks = 0;

    // 计算总任务数
    for (const model of testModels) {
      for (const prompt of testPrompts) {
        for (const story of testStories) {
          const questions = this.questions.filter(q => q.storyId === story.id);
          totalTasks += Math.min(questions.length, config.maxQuestionsPerStory);
          
          const answerTest = this.answerTests.find(t => t.storyId === story.id);
          if (answerTest) {
            totalTasks += answerTest.cases.length;
          }
        }
      }
    }

    logger.info(`总任务数: ${totalTasks}`);

    // 执行测试
    for (const model of testModels) {
      for (const prompt of testPrompts) {
        logger.info(`\n测试: ${model.name} + ${prompt.name}`);
        
        for (const story of testStories) {
          // 问答测试
          await this.runQATests(model, prompt, story, config, (progress) => {
            completedTasks += progress;
            logger.progress(completedTasks, totalTasks, `${model.name} - ${story.title}`);
          });

          // 答案验证测试
          await this.runValidationTests(model, prompt, story, () => {
            completedTasks += 1;
            logger.progress(completedTasks, totalTasks, `${model.name} - 答案验证`);
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.success(`测试完成! 耗时: ${(duration / 1000 / 60).toFixed(1)} 分钟`);

    return {
      results: this.results,
      validations: this.validations,
      duration
    };
  }

  private async runQATests(
    model: ModelConfig,
    prompt: PromptTemplate,
    story: Story,
    config: BenchmarkConfig,
    onProgress: (n: number) => void
  ) {
    const questions = this.questions
      .filter(q => q.storyId === story.id)
      .slice(0, config.maxQuestionsPerStory);

    for (const q of questions) {
      const context = `【海龟汤】\n标题：${story.title}\n谜面：${story.scenario}\n汤底：${story.answer}`;
      const userPrompt = prompt.userPromptTemplate
        .replace('{context}', context)
        .replace('{question}', q.question);

      const response = await this.api.chat({
        model: model.id,
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        maxTokens: 10,
        temperature: 0.1,
        timeout: config.timeout
      });

      const result: TestResult = {
        modelId: model.id,
        promptId: prompt.id,
        storyId: story.id,
        questionId: q.id,
        question: q.question,
        expected: q.expected,
        actual: this.evaluator.normalizeAnswer(response.content),
        correct: this.evaluator.isCorrect(response.content, q.expected),
        latency: response.latency,
        tokensUsed: response.tokensUsed,
        cost: this.calculateCost(model, response.tokensUsed || 0),
        timestamp: new Date().toISOString(),
        rawResponse: response.content
      };

      this.results.push(result);
      onProgress(1);

      // 错误时记录警告
      if (!result.correct) {
        logger.warn(`错误: ${q.question} → 期望"${q.expected}", 实际"${result.actual}"`);
      }
    }
  }

  private async runValidationTests(
    model: ModelConfig,
    prompt: PromptTemplate,
    story: Story,
    onProgress: () => void
  ) {
    const answerTest = this.answerTests.find(t => t.storyId === story.id);
    if (!answerTest) return;

    for (const testCase of answerTest.cases) {
      const verifyPrompt = `你是海龟汤游戏裁判。判断玩家的答案是否与汤底相符。

【当前海龟汤】
标题：${story.title}
汤底（真相）：${story.answer}

【玩家提交的答案】
${testCase.answer}

请只回答「正确」「错误」「接近」三个字之一：`;

      const response = await this.api.chat({
        model: model.id,
        messages: [
          { role: 'system', content: '你是海龟汤游戏裁判，只能回答「正确」「错误」「接近」三个字之一。' },
          { role: 'user', content: verifyPrompt }
        ],
        maxTokens: 10,
        temperature: 0.1
      });

      const actual = this.evaluator.normalizeValidation(response.content);
      
      const result: ValidationResult = {
        modelId: model.id,
        promptId: prompt.id,
        storyId: story.id,
        answer: testCase.answer,
        expected: testCase.expect,
        actual,
        isCorrect: actual === testCase.expect,
        latency: response.latency,
        timestamp: new Date().toISOString()
      };

      this.validations.push(result);
      onProgress();

      if (!result.isCorrect) {
        logger.warn(`判定错误: "${testCase.answer.substring(0, 20)}..." → 期望"${testCase.expect}", 实际"${actual}"`);
      }
    }
  }

  private calculateCost(model: ModelConfig, tokens: number): number {
    const costPerToken = (model.costPer1KInputTokens || 0) / 1000;
    return tokens * costPerToken;
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = path.join(process.cwd(), 'results');
    
    await fs.mkdir(resultsDir, { recursive: true });
    
    const filename = `benchmark-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    await fs.writeFile(
      filepath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        results: this.results,
        validations: this.validations
      }, null, 2)
    );
    
    logger.success(`结果已保存: ${filepath}`);
    return filepath;
  }
}
