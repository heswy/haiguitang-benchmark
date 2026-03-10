import { TestResult, ValidationResult, ModelScore } from '../types/index.js';

export class Evaluator {
  /**
   * 标准化 AI 回答
   */
  normalizeAnswer(raw: string): string {
    if (!raw) return '未知';
    
    const cleaned = raw
      .replace(/[「」\[\]"'"'']/g, '')  // 去除引号
      .replace(/是/, '是')
      .replace(/不是|否|不对/, '不是')
      .replace(/无关|没关系|不相关|不知道/, '无关')
      .trim();
    
    if (cleaned.includes('是') && !cleaned.includes('不是')) return '是';
    if (cleaned.includes('不是') || cleaned.includes('否')) return '不是';
    if (cleaned.includes('无关')) return '无关';
    
    // 默认归类
    return '未知';
  }

  /**
   * 标准化答案验证结果
   */
  normalizeValidation(raw: string): 'correct' | 'close' | 'wrong' {
    if (!raw) return 'wrong';
    
    const cleaned = raw
      .replace(/[「」\[\]"'"'']/g, '')
      .trim();
    
    if (cleaned.includes('正确')) return 'correct';
    if (cleaned.includes('接近') || cleaned.includes('部分')) return 'close';
    return 'wrong';
  }

  /**
   * 判断回答是否正确
   */
  isCorrect(actual: string, expected: string): boolean {
    const normalized = this.normalizeAnswer(actual);
    
    // 严格匹配
    if (normalized === expected) return true;
    
    // 模糊匹配
    const expectedMap: Record<string, string[]> = {
      '是': ['是', '对的', '没错', '正确'],
      '不是': ['不是', '否', '不对', '错误', '没'],
      '无关': ['无关', '没关系', '不相关', ' irrelevant']
    };
    
    const expectedVariants = expectedMap[expected] || [expected];
    return expectedVariants.some(v => normalized.includes(v));
  }

  /**
   * 计算模型综合得分
   */
  calculateScores(results: TestResult[], validations: ValidationResult[]): ModelScore[] {
    const modelGroups = new Map<string, { results: TestResult[]; validations: ValidationResult[] }>();
    
    // 按模型分组
    for (const r of results) {
      const key = `${r.modelId}::${r.promptId}`;
      if (!modelGroups.has(key)) {
        modelGroups.set(key, { results: [], validations: [] });
      }
      modelGroups.get(key)!.results.push(r);
    }
    
    for (const v of validations) {
      const key = `${v.modelId}::${v.promptId}`;
      if (modelGroups.has(key)) {
        modelGroups.get(key)!.validations.push(v);
      }
    }
    
    const scores: ModelScore[] = [];
    
    for (const [key, data] of modelGroups) {
      const [modelId, promptId] = key.split('::');
      const modelResults = data.results;
      const modelValidations = data.validations;
      
      // 问答阶段指标
      const qaCorrect = modelResults.filter(r => r.correct).length;
      const qaAccuracy = modelResults.length > 0 ? qaCorrect / modelResults.length : 0;
      
      // 一致性：同一故事内回答是否矛盾（简化版）
      const qaConsistency = this.calculateConsistency(modelResults);
      
      // 帮助性：无关回答比例越低越有帮助
      const irrelevantRatio = modelResults.filter(r => r.actual === '无关').length / modelResults.length;
      const qaHelpfulness = 1 - irrelevantRatio;
      
      // 安全性：被诱导说出答案的次数（简化，检测是否有回答包含汤底关键词）
      const qaSafety = 1; // 暂不计算
      
      // 答案验证阶段
      const valCorrect = modelValidations.filter(v => v.isCorrect).length;
      const valAccuracy = modelValidations.length > 0 ? valCorrect / modelValidations.length : 0;
      
      // 容忍度：同义表述被判正确的比例
      const toleranceCases = modelValidations.filter(v => v.expected === 'correct' && v.actual === 'correct');
      const valTolerance = toleranceCases.length / Math.max(modelValidations.filter(v => v.expected === 'correct').length, 1);
      
      // 误判统计
      const valFalsePos = modelValidations.filter(v => v.expected === 'wrong' && v.actual === 'correct').length;
      const valFalseNeg = modelValidations.filter(v => v.expected === 'correct' && v.actual === 'wrong').length;
      
      // 效率指标
      const avgLatency = modelResults.reduce((sum, r) => sum + r.latency, 0) / modelResults.length || 0;
      const totalCost = modelResults.reduce((sum, r) => sum + (r.cost || 0), 0);
      const avgCost = totalCost / modelResults.length || 0;
      
      // 综合得分（加权）
      const overallScore = 
        qaAccuracy * 0.25 +
        qaConsistency * 0.15 +
        valAccuracy * 0.30 +
        valTolerance * 0.15 +
        (1 - Math.min(valFalsePos + valFalseNeg, 10) / 10) * 0.15;
      
      scores.push({
        modelId,
        promptId,
        qaAccuracy,
        qaConsistency,
        qaHelpfulness,
        qaSafety,
        valAccuracy,
        valTolerance,
        valFalsePos,
        valFalseNeg,
        avgLatency,
        avgCost,
        totalCost,
        overallScore
      });
    }
    
    // 按综合得分排序
    return scores.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * 计算一致性（简化版）
   * 检查是否有明显矛盾的判定
   */
  private calculateConsistency(results: TestResult[]): number {
    if (results.length === 0) return 0;
    
    // 按故事分组
    const storyGroups = new Map<number, TestResult[]>();
    for (const r of results) {
      if (!storyGroups.has(r.storyId)) {
        storyGroups.set(r.storyId, []);
      }
      storyGroups.get(r.storyId)!.push(r);
    }
    
    let consistentStories = 0;
    
    for (const [, storyResults] of storyGroups) {
      // 检查同一故事内的逻辑一致性
      // 简化：如果正确率 > 50%，认为基本一致
      const correct = storyResults.filter(r => r.correct).length;
      if (correct / storyResults.length >= 0.5) {
        consistentStories++;
      }
    }
    
    return consistentStories / storyGroups.size;
  }

  /**
   * 生成错误分析
   */
  generateErrorReport(results: TestResult[]): any[] {
    const errors = results.filter(r => !r.correct);
    
    // 按类型分组
    const byType = new Map<string, number>();
    for (const e of errors) {
      // 从 questionId 提取类型
      const type = e.questionId?.split('-')[1]?.substring(0, 2) || 'unknown';
      byType.set(type, (byType.get(type) || 0) + 1);
    }
    
    return Array.from(byType.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }
}
