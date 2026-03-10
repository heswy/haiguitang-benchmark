import fs from 'fs/promises';
import path from 'path';
import { BenchmarkReport, ModelScore, TestResult, ValidationResult } from '../types/index.js';
import { Evaluator } from '../evaluators/evaluator.js';

export class HTMLReporter {
  private evaluator = new Evaluator();

  async generate(reportData: BenchmarkReport, outputPath?: string): Promise<string> {
    const html = this.buildHTML(reportData);
    
    const outputFile = outputPath || path.join(
      process.cwd(),
      'results',
      `report-${new Date().toISOString().replace(/[:.]/g, '-')}.html`
    );
    
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, html, 'utf-8');
    
    return outputFile;
  }

  async generateFromFile(resultsFile: string): Promise<string> {
    const data = await fs.readFile(resultsFile, 'utf-8');
    const parsed = JSON.parse(data);
    
    const report: BenchmarkReport = {
      id: `report-${Date.now()}`,
      name: '海龟汤 AI 模型评测报告',
      timestamp: parsed.timestamp,
      duration: parsed.duration || 0,
      config: {
        models: [...new Set(parsed.results.map((r: TestResult) => r.modelId))],
        prompts: [...new Set(parsed.results.map((r: TestResult) => r.promptId))],
        stories: [...new Set(parsed.results.map((r: TestResult) => r.storyId))]
      },
      scores: this.evaluator.calculateScores(parsed.results, parsed.validations),
      results: parsed.results,
      validations: parsed.validations
    };
    
    return this.generate(report);
  }

  private buildHTML(report: BenchmarkReport): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>海龟汤 AI 模型评测报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 40px 20px; }
    header {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 20px;
      margin-bottom: 40px;
    }
    h1 { font-size: 2.5rem; background: linear-gradient(90deg, #00d4ff, #7b2cbf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
    .subtitle { color: #888; font-size: 1.1rem; }
    .meta { margin-top: 20px; color: #666; font-size: 0.9rem; }
    
    .card {
      background: #141414;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      border: 1px solid #222;
    }
    .card-title { font-size: 1.5rem; margin-bottom: 20px; color: #fff; }
    
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #222; }
    th { color: #888; font-weight: 500; font-size: 0.85rem; text-transform: uppercase; }
    tr:hover { background: rgba(255,255,255,0.02); }
    
    .rank-1 { color: #ffd700; font-weight: bold; }
    .rank-2 { color: #c0c0c0; font-weight: bold; }
    .rank-3 { color: #cd7f32; font-weight: bold; }
    
    .score { font-weight: bold; }
    .score-high { color: #4ade80; }
    .score-mid { color: #fbbf24; }
    .score-low { color: #f87171; }
    
    .metric { display: inline-flex; align-items: center; gap: 6px; }
    .metric-bar {
      width: 60px;
      height: 6px;
      background: #222;
      border-radius: 3px;
      overflow: hidden;
    }
    .metric-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }
    .metric-fill.high { background: #4ade80; }
    .metric-fill.mid { background: #fbbf24; }
    .metric-fill.low { background: #f87171; }
    
    .chart-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      margin-top: 20px;
    }
    
    .error-case {
      background: #1a1a1a;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 3px solid #f87171;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-correct { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    .badge-wrong { background: rgba(248, 113, 113, 0.2); color: #f87171; }
    .badge-close { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
    
    footer { text-align: center; padding: 40px; color: #666; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🧪 海龟汤 AI 模型评测报告</h1>
      <p class="subtitle">SiliconFlow 大模型游戏能力横向评测</p>
      <p class="meta">生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')} | 测试时长: ${(report.duration / 1000 / 60).toFixed(1)} 分钟</p>
    </header>

    <div class="card">
      <h2 class="card-title">🏆 综合排名</h2>
      ${this.renderRankingTable(report.scores)}
    </div>

    <div class="card">
      <h2 class="card-title">📊 详细指标对比</h2>
      ${this.renderMetricsTable(report.scores)}
    </div>

    <div class="card">
      <h2 class="card-title">❌ 典型错误案例</h2>
      ${this.renderErrorCases(report.results, report.validations)}
    </div>

    <footer>
      <p>haiguitang-benchmark v1.0 | 测试框架自动生成</p>
    </footer>
  </div>
  
  <script>
    // 简单的交互：点击行展开详情
    document.querySelectorAll('tr[data-toggle]').forEach(row => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        row.classList.toggle('expanded');
      });
    });
  </script>
</body>
</html>`;
  }

  private renderRankingTable(scores: ModelScore[]): string {
    if (scores.length === 0) return '<p>暂无数据</p>';
    
    return `<table>
      <thead>
        <tr>
          <th>排名</th>
          <th>模型</th>
          <th>提示词</th>
          <th>问答准确率</th>
          <th>判定准确率</th>
          <th>综合得分</th>
        </tr>
      </thead>
      <tbody>
        ${scores.map((s, i) => {
          const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
          const scoreClass = s.overallScore >= 0.8 ? 'score-high' : s.overallScore >= 0.6 ? 'score-mid' : 'score-low';
          return `<tr>
            <td class="${rankClass}">${i + 1}</td>
            <td>${s.modelId}</td>
            <td>${s.promptId}</td>
            <td>${(s.qaAccuracy * 100).toFixed(1)}%</td>
            <td>${(s.valAccuracy * 100).toFixed(1)}%</td>
            <td class="score ${scoreClass}">${(s.overallScore * 100).toFixed(1)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  }

  private renderMetricsTable(scores: ModelScore[]): string {
    return `<table>
      <thead>
        <tr>
          <th>模型</th>
          <th>一致性</th>
          <th>帮助性</th>
          <th>容忍度</th>
          <th>误判(错/漏)</th>
          <th>平均延迟</th>
          <th>总成本</th>
        </tr>
      </thead>
      <tbody>
        ${scores.map(s => `<tr>
          <td>${s.modelId}</td>
          <td>${this.renderMetricBar(s.qaConsistency)}</td>
          <td>${this.renderMetricBar(s.qaHelpfulness)}</td>
          <td>${this.renderMetricBar(s.valTolerance)}</td>
          <td>${s.valFalsePos}/${s.valFalseNeg}</td>
          <td>${s.avgLatency.toFixed(0)}ms</td>
          <td>¥${s.totalCost.toFixed(4)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  private renderMetricBar(value: number): string {
    const pct = Math.round(value * 100);
    const cls = value >= 0.8 ? 'high' : value >= 0.6 ? 'mid' : 'low';
    return `<div class="metric">
      <span>${pct}%</span>
      <div class="metric-bar"><div class="metric-fill ${cls}" style="width: ${pct}%"></div></div>
    </div>`;
  }

  private renderErrorCases(results: TestResult[], validations: ValidationResult[]): string {
    const qaErrors = results.filter(r => !r.correct).slice(0, 5);
    const valErrors = validations.filter(v => !v.isCorrect).slice(0, 5);
    
    let html = '';
    
    if (qaErrors.length > 0) {
      html += '<h3>问答阶段错误</h3>';
      qaErrors.forEach(e => {
        html += `<div class="error-case">
          <p><strong>${e.modelId}</strong> | ${e.question}</p>
          <p>期望: <span class="badge badge-correct">${e.expected}</span> | 
             实际: <span class="badge badge-wrong">${e.actual}</span></p>
        </div>`;
      });
    }
    
    if (valErrors.length > 0) {
      html += '<h3>答案判定错误</h3>';
      valErrors.forEach(e => {
        html += `<div class="error-case">
          <p><strong>${e.modelId}</strong></p>
          <p>答案: ${e.answer.substring(0, 50)}...</p>
          <p>期望: <span class="badge badge-${e.expected}">${e.expected}</span> | 
             判定: <span class="badge badge-${e.actual}">${e.actual}</span></p>
        </div>`;
      });
    }
    
    return html || '<p>暂无错误记录</p>';
  }
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const resultsFile = process.argv[2];
  if (!resultsFile) {
    console.error('Usage: npx ts-node src/reporters/html-reporter.ts <results-file>');
    process.exit(1);
  }
  
  const reporter = new HTMLReporter();
  reporter.generateFromFile(resultsFile).then(output => {
    console.log(`报告已生成: ${output}`);
  }).catch(err => {
    console.error('生成失败:', err);
    process.exit(1);
  });
}
