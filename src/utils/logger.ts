import chalk from 'chalk';

export class Logger {
  private prefix: string;

  constructor(prefix: string = 'Benchmark') {
    this.prefix = prefix;
  }

  info(message: string) {
    console.log(chalk.blue(`[${this.prefix}] ${message}`));
  }

  success(message: string) {
    console.log(chalk.green(`[${this.prefix}] ✅ ${message}`));
  }

  error(message: string, error?: any) {
    console.error(chalk.red(`[${this.prefix}] ❌ ${message}`));
    if (error) {
      console.error(chalk.gray(error.stack || error.message || error));
    }
  }

  warn(message: string) {
    console.log(chalk.yellow(`[${this.prefix}] ⚠️ ${message}`));
  }

  progress(current: number, total: number, message: string) {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    console.log(chalk.cyan(`[${bar}] ${percent}% | ${message}`));
  }

  result(name: string, value: string | number, unit?: string) {
    const val = typeof value === 'number' ? value.toFixed(2) : value;
    console.log(chalk.white(`  ${name}: ${chalk.magenta(val)}${unit || ''}`));
  }
}

export const logger = new Logger();
