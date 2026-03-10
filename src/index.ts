#!/usr/bin/env node

import { BenchmarkRunner, BenchmarkConfig } from './runners/benchmark.js';
import { HTMLReporter } from './reporters/html-reporter.js';
import { Evaluator } from './evaluators/evaluator.js';
import { Logger } from './utils/logger.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const logger = new Logger('Main');

async function main() {
  // 检查环境变量
  const apiKey = process.env.SILICON_FLOW_API_KEY;
  const apiUrl = process.env.SILICON_FLOW_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
  
  if (!apiKey) {
    logger.error('请设置 SILICON_FLOW_API_KEY 环境变量');
    console.log('\n1. 复制 .env.example 到 .env');
    console.log('2. 在 .env 中填入你的 API Key');
    console.log('\n获取 API Key: https://cloud.siliconflow.cn/');
    process.exit(1);
  }

  // 解析命令行参数
  const args = process.argv.slice(2);
  const models = args.includes('--models') 
    ? args[args.indexOf('--models') + 1].split(',')
    : ['Pro/zai-org/GLM-4.7']; // 默认只测一个，避免费用过高
    
  const prompts = args.includes('--prompts')
    ? args[args.indexOf('--prompts') + 1].split(',')
    : ['v1', 'v2'];
    
  const stories = args.includes('--stories')
    ? args[args.indexOf('--stories') + 1].split(',').map(Number)
    : [1, 2, 3, 25, 29, 30]; // 默认测 6 个代表性故事
    
  const maxQuestions = args.includes('--max-questions')
    ? parseInt(args[args.indexOf('--max-questions') + 1])
    : 5; // 每个故事最多 5 个问题

  const config: BenchmarkConfig = {
    models,
    prompts,
    stories,
    delayMs: parseInt(process.env.DELAY_BETWEEN_REQUESTS || '500'),
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
    maxQuestionsPerStory: maxQuestions
  };

  logger.info('🧪 海龟汤 AI 模型评测');
  logger.info(`模型: ${models.join(', ')}`);
  logger.info(`提示词: ${prompts.join(', ')}`);
  logger.info(`故事: ${stories.join(', ')}`);
  logger.info(`每故事问题数: ${maxQuestions}`);

  // 估算费用
  const estimatedCalls = models.length * prompts.length * stories.length * (maxQuestions + 3);
  const estimatedCost = estimatedCalls * 0.0001; // 粗略估算
  logger.info(`预估 API 调用: ${estimatedCalls} 次, 费用约 ¥${estimatedCost.toFixed(2)}`);

  // 确认执行
  if (!args.includes('--yes')) {
    logger.info('5秒后开始测试，按 Ctrl+C 取消...');
    await new Promise(r => setTimeout(r, 5000));
  }

  // 创建 runner
  const runner = new BenchmarkRunner(apiKey, apiUrl, config.delayMs);
  
  try {
    // 加载数据
    await runner.loadData();
    
    // 运行测试
    const { results, validations, duration } = await runner.run(config);
    
    // 保存结果
    const resultsFile = await runner.saveResults();
    
    // 生成报告
    logger.info('生成报告...');
    const evaluator = new Evaluator();
    const scores = evaluator.calculateScores(results, validations);
    
    const reporter = new HTMLReporter();
    const reportData = {
      id: `benchmark-${Date.now()}`,
      name: '海龟汤 AI 模型评测',
      timestamp: new Date().toISOString(),
      duration,
      config: {
        models: config.models,
        prompts: config.prompts,
        stories: config.stories
      },
      scores,
      results,
      validations
    };
    
    const reportFile = await reporter.generate(reportData);
    
    // 输出摘要
    logger.success('\n✅ 测试完成!');
    logger.info(`结果文件: ${resultsFile}`);
    logger.info(`报告文件: ${reportFile}`);
    
    // 打印排名
    console.log('\n📊 排名摘要:');
    scores.slice(0, 5).forEach((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      console.log(`   ${medal} ${s.modelId} + ${s.promptId}: ${(s.overallScore * 100).toFixed(1)}分`);
    });
    
  } catch (error) {
    logger.error('测试失败', error);
    process.exit(1);
  }
}

// 生成报告模式
async function generateReport(resultsFile: string) {
  if (!resultsFile) {
    // 查找最新的结果文件
    const resultsDir = path.join(process.cwd(), 'results');
    try {
      const files = await fs.readdir(resultsDir);
      const jsonFiles = files.filter(f => f.startsWith('benchmark-') && f.endsWith('.json'));
      if (jsonFiles.length === 0) {
        logger.error('未找到结果文件');
        process.exit(1);
      }
      jsonFiles.sort().reverse();
      resultsFile = path.join(resultsDir, jsonFiles[0]);
    } catch {
      logger.error('无法读取 results 目录');
      process.exit(1);
    }
  }
  
  logger.info(`从 ${resultsFile} 生成报告...`);
  
  const reporter = new HTMLReporter();
  const output = await reporter.generateFromFile(resultsFile);
  
  logger.success(`报告已生成: ${output}`);
}

// 主入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'report') {
    generateReport(process.argv[3]).catch(err => {
      logger.error('生成失败', err);
      process.exit(1);
    });
  } else {
    main().catch(err => {
      logger.error('执行失败', err);
      process.exit(1);
    });
  }
}
