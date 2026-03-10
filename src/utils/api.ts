import { Logger } from './logger.js';

const logger = new Logger('API');

export interface AIRequestOptions {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  latency: number;
  error?: string;
}

export class SiliconFlowAPI {
  private apiKey: string;
  private baseUrl: string;
  private delay: number;

  constructor(apiKey: string, baseUrl: string, delayMs: number = 500) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.delay = delayMs;
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    const startTime = Date.now();

    // 延迟控制，避免 rate limit
    if (this.delay > 0) {
      await this.sleep(this.delay);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages,
          max_tokens: options.maxTokens || 10,
          temperature: options.temperature ?? 0.1,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        content: data.choices?.[0]?.message?.content?.trim() || '',
        tokensUsed: data.usage?.total_tokens,
        latency,
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      logger.error(`API 请求失败: ${options.model}`, error);
      
      return {
        content: '',
        latency,
        error: error.message,
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
