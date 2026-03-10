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
        models: [...new Set(parsed.results.map((r: TestResult) => r.modelId))] as string[],
        prompts: [...new Set(parsed.results.map((r: TestResult) => r.promptId))] as string[],
        stories: [...new Set(parsed.results.map((r: TestResult) => r.storyId))] as number[]
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
    
    .best-score { 
      position: relative;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
    }
    
    .col-best {
      background: rgba(74, 222, 128, 0.15);
      box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.3);
    }
    
    footer { text-align: center; padding: 40px; color: #666; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🧪 海龟汤 AI 模型评测报告</h1>
      <p style="color: #666; font-size: 0.9rem; margin-top: 8px;">haiguitang-benchmark</p>
    </header>

    <div class="card">
      <h2 class="card-title">🏆 综合排名</h2>
      ${this.renderRankingTable(report.scores)}
    </div>

    <div class="card">
      <h2 class="card-title">📊 详细指标对比</h2>
      ${this.renderMetricsTable(report.scores)}
    </div>

    <div class="card" style="background: #0f0f0f; border: 1px solid #1a1a1a;">
      <h2 class="card-title" style="font-size: 1rem; color: #666;">ℹ️ 指标解释</h2>
      <div style="color: #666; font-size: 0.8rem; line-height: 1.8;">
        <p><strong style="color: #888;">一致性</strong>：模型在同一故事内回答的逻辑自洽程度，避免前后矛盾</p>
        <p><strong style="color: #888;">帮助性</strong>：1 - 无关回答比例，反映对玩家推理的推进程度</p>
        <p><strong style="color: #888;">容忍度</strong>：对同义表述的接受比例，衡量理解意思相近答案的能力</p>
        <p><strong style="color: #888;">误判(错/漏)</strong>：错判=错误答案判为正确；漏判=正确答案判为错误</p>
      </div>
    </div>

    <footer>
      <p>haiguitang-benchmark v1.0 | 测试框架自动生成</p>
    </footer>
  </div>
  
  <script>
    // 表格排序功能
    (function() {
      const table = document.getElementById('metrics-table');
      if (!table) return;
      
      const headers = table.querySelectorAll('th[data-sort]');
      const tbody = table.querySelector('tbody');
      let sortDirection = {};
      
      headers.forEach(header => {
        header.addEventListener('click', () => {
          const sortKey = header.getAttribute('data-sort');
          const rows = Array.from(tbody.querySelectorAll('tr'));
          const isAsc = !sortDirection[sortKey];
          sortDirection[sortKey] = isAsc;
          
          rows.sort((a, b) => {
            let aVal, bVal;
            
            switch(sortKey) {
              case 'model':
                aVal = a.getAttribute('data-model') || '';
                bVal = b.getAttribute('data-model') || '';
                break;
              case 'prompt':
                aVal = a.getAttribute('data-prompt') || '';
                bVal = b.getAttribute('data-prompt') || '';
                break;
              case 'consistency':
              case 'helpfulness':
              case 'tolerance':
                aVal = parseFloat(a.getAttribute('data-' + sortKey) || '0');
                bVal = parseFloat(b.getAttribute('data-' + sortKey) || '0');
                break;
              case 'errors':
                aVal = parseInt(a.getAttribute('data-errors') || '0');
                bVal = parseInt(b.getAttribute('data-errors') || '0');
                break;
              default:
                return 0;
            }
            
            if (typeof aVal === 'number') {
              return isAsc ? aVal - bVal : bVal - aVal;
            }
            return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          });
          
          rows.forEach(row => tbody.appendChild(row));
          
          // 更新表头指示
          headers.forEach(h => {
            const baseText = h.textContent.replace(/[↑↓↕]/g, '').trim();
            h.textContent = h === header ? baseText + (isAsc ? ' ↑' : ' ↓') : baseText + ' ↕';
          });
        });
      });
    })();
  </script>
</body>
</html>`;
  }

  private renderRankingTable(scores: ModelScore[]): string {
    if (scores.length === 0) return '<p>暂无数据</p>';
    
    // 按模型分组，并找出最佳表现用于排序
    const modelGroups = new Map<string, ModelScore[]>();
    for (const s of scores) {
      if (!modelGroups.has(s.modelId)) {
        modelGroups.set(s.modelId, []);
      }
      modelGroups.get(s.modelId)!.push(s);
    }
    
    // 获取所有提示词（作为列）
    const allPrompts = [...new Set(scores.map(s => s.promptId))].sort();
    
    // 计算每个模型的最佳得分，用于排序
    const modelBestScores = new Map<string, number>();
    for (const [modelId, modelScores] of modelGroups) {
      const best = Math.max(...modelScores.map(s => s.overallScore));
      modelBestScores.set(modelId, best);
    }
    
    // 按最佳得分排序模型
    const sortedModels = [...modelGroups.entries()]
      .sort((a, b) => modelBestScores.get(b[0])! - modelBestScores.get(a[0])!);
    
    // 简化模型名称显示
    const shortenModelName = (fullId: string): string => {
      const parts = fullId.split('/');
      return parts[parts.length - 1];
    };
    
    // 获取得分颜色样式
    const getScoreClass = (score: number): string => {
      if (score >= 0.8) return 'score-high';
      if (score >= 0.6) return 'score-mid';
      return 'score-low';
    };
    
    // 计算每列的最大值（用于列高亮）
    const colMaxScores = new Map<string, number>();
    for (const promptId of allPrompts) {
      const colScores = scores.filter(s => s.promptId === promptId).map(s => s.overallScore);
      colMaxScores.set(promptId, Math.max(...colScores));
    }
    
    return `<table>
      <thead>
        <tr>
          <th>排名</th>
          <th>模型</th>
          ${allPrompts.map(p => `<th>${p} prompt</th>`).join('')}
          <th>最佳得分</th>
        </tr>
      </thead>
      <tbody>
        ${sortedModels.map(([modelId, modelScores], index) => {
          const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
          const bestScore = modelBestScores.get(modelId)!;
          const bestPrompt = modelScores.find(s => s.overallScore === bestScore)?.promptId || '-';
          
          // 为每个提示词生成单元格
          const promptCells = allPrompts.map(promptId => {
            const score = modelScores.find(s => s.promptId === promptId);
            if (!score) return '<td>-</td>';
            const scoreClass = getScoreClass(score.overallScore);
            const isRowBest = score.overallScore === bestScore; // 行最佳，标星星
            const isColBest = score.overallScore === colMaxScores.get(promptId); // 列最佳，高亮
            const cellClass = `score ${scoreClass}${isColBest ? ' col-best' : ''}`;
            return `<td class="${cellClass}">${(score.overallScore * 100).toFixed(1)}${isRowBest ? ' ★' : ''}</td>`;
          }).join('');
          
          return `<tr>
            <td class="${rankClass}">${index + 1}</td>
            <td><strong>${shortenModelName(modelId)}</strong><br><span style="font-size:0.75rem;color:#666">${modelId}</span></td>
            ${promptCells}
            <td class="score ${getScoreClass(bestScore)}">${(bestScore * 100).toFixed(1)}<br><span style="font-size:0.75rem;color:#888">${bestPrompt}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  }

  private renderMetricsTable(scores: ModelScore[]): string {
    // 简化模型名称显示
    const shortenModelName = (fullId: string): string => {
      const parts = fullId.split('/');
      return parts[parts.length - 1];
    };
    
    // 按模型分组排序：先按模型ID排序，再按prompt排序(v1在前v2在后)
    const sortedScores = [...scores].sort((a, b) => {
      if (a.modelId !== b.modelId) {
        return a.modelId.localeCompare(b.modelId);
      }
      return a.promptId.localeCompare(b.promptId);
    });
    
    return `<table id="metrics-table" class="sortable-table">
      <thead>
        <tr>
          <th data-sort="model" style="cursor:pointer; user-select:none;">模型 ↕</th>
          <th data-sort="prompt" style="cursor:pointer; user-select:none;">Prompt ↕</th>
          <th data-sort="consistency" style="cursor:pointer; user-select:none;">一致性 ↕</th>
          <th data-sort="helpfulness" style="cursor:pointer; user-select:none;">帮助性 ↕</th>
          <th data-sort="tolerance" style="cursor:pointer; user-select:none;">容忍度 ↕</th>
          <th data-sort="errors" style="cursor:pointer; user-select:none;">误判(错/漏) ↕</th>
        </tr>
      </thead>
      <tbody>
        ${sortedScores.map(s => `<tr data-model="${s.modelId}" data-prompt="${s.promptId}" data-consistency="${s.qaConsistency}" data-helpfulness="${s.qaHelpfulness}" data-tolerance="${s.valTolerance}" data-errors="${s.valFalsePos + s.valFalseNeg}">
          <td><strong>${shortenModelName(s.modelId)}</strong><br><span style="font-size:0.75rem;color:#666">${s.modelId}</span></td>
          <td><span style="color:#888">${s.promptId}</span></td>
          <td>${this.renderMetricBar(s.qaConsistency)}</td>
          <td>${this.renderMetricBar(s.qaHelpfulness)}</td>
          <td>${this.renderMetricBar(s.valTolerance)}</td>
          <td>${s.valFalsePos}/${s.valFalseNeg}</td>
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
