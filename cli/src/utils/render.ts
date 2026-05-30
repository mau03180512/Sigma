import chalk from 'chalk';

export function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
      const label = lang ? ` ${lang} ` : '';
      return `\n${chalk.dim('┌' + '─'.repeat(50) + '┐')}\n${chalk.dim(`│${label}${' '.repeat(Math.max(0, 49 - label.length))}│`)}\n${chalk.dim('├' + '─'.repeat(50) + '┤')}\n${chalk.cyan(code.trim())}\n${chalk.dim('└' + '─'.repeat(50) + '┘')}\n`;
    })
    .replace(/`([^`]+)`/g, (_match, code: string) => chalk.cyan(code))
    .replace(/\*\*([^*]+)\*\*/g, (_match, text: string) => chalk.bold(text))
    .replace(/\*([^*]+)\*/g, (_match, text: string) => chalk.italic(text))
    .replace(/^### (.+)$/gm, (_match, text: string) => chalk.bold.underline(text))
    .replace(/^## (.+)$/gm, (_match, text: string) => chalk.bold.underline(text))
    .replace(/^# (.+)$/gm, (_match, text: string) => chalk.bold.underline(text));
}

export function printBotMessage(text: string): void {
  const lines = text.split('\n');
  for (const line of lines) {
    console.log(`  ${chalk.green('Σ')} ${renderMarkdown(line)}`);
  }
}

export function printErrorMessage(text: string): void {
  console.error(`  ${chalk.red('✖')} ${text}`);
}

export function printInfoMessage(text: string): void {
  console.log(`  ${chalk.blue('ℹ')} ${text}`);
}

export function printSuccessMessage(text: string): void {
  console.log(`  ${chalk.green('✔')} ${text}`);
}

export function printHeader(): void {
  console.log(`\n  ${chalk.bold.cyan('Σ Sigma AI')} ${chalk.dim('— your AI assistant')}\n`);
}

export function printHelp(): void {
  printHeader();
  console.log(`  ${chalk.bold('Usage:')}`);
  console.log(`    sigma-ai "question"            One-shot question`);
  console.log(`    sigma-ai chat                  Interactive chat`);
  console.log(`    sigma-ai login                 Authenticate with Firebase`);
  console.log(`    sigma-ai logout                Remove saved credentials`);
  console.log(`    sigma-ai models                List available models`);
  console.log(`    sigma-ai --model <name> ...    Choose a model`);
  console.log(`    cat file | sigma-ai ...        Pipe input from stdin`);
  console.log(`    sigma-ai /ctf "analyze this"   Use a slash command mode`);
  console.log(``);
}
