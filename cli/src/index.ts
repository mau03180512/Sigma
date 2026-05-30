#!/usr/bin/env node
import { Command } from 'commander';
import { askCommand } from './commands/ask.js';
import { chatCommand } from './commands/chat.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { modelsCommand } from './commands/models.js';
import { printHelp } from './utils/render.js';

const program = new Command();

program
  .name('sigma-ai')
  .description('Sigma AI — your AI assistant')
  .version('1.0.0')
  .option('-m, --model <name>', 'Model to use (e.g. llama-3.3-70b-versatile)')
  .option('-p, --provider <name>', 'AI provider (groq | nim)', 'groq');

program
  .command('login')
  .description('Authenticate with Firebase')
  .action(loginCommand);

program
  .command('logout')
  .description('Remove saved credentials')
  .action(logoutCommand);

program
  .command('models')
  .description('List available models')
  .action(modelsCommand);

program
  .command('chat')
  .description('Interactive REPL chat')
  .option('-m, --model <name>', 'Model to use')
  .option('-p, --provider <name>', 'AI provider', 'groq')
  .action(async (cmdOpts) => {
    const globalOpts = program.opts();
    await chatCommand({
      model: cmdOpts.model || globalOpts.model,
      provider: (cmdOpts.provider || globalOpts.provider) as 'groq' | 'nim',
    });
  });

program
  .command('ask', { isDefault: true })
  .description('Ask a one-shot question')
  .argument('[prompt...]', 'Your question')
  .option('-m, --model <name>', 'Model to use')
  .option('-p, --provider <name>', 'AI provider', 'groq')
  .action(async (promptArgs: string[], cmdOpts) => {
    const globalOpts = program.opts();
    let prompt = promptArgs.join(' ');

    // Read from stdin if piped and no prompt provided
    if (!prompt && !process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      prompt = Buffer.concat(chunks).toString('utf-8').trim();
    }

    if (!prompt) {
      printHelp();
      process.exit(0);
    }

    await askCommand(prompt, {
      model: cmdOpts.model || globalOpts.model,
      provider: (cmdOpts.provider || globalOpts.provider) as 'groq' | 'nim',
    });
  });

// If no subcommand and no arguments, show help
if (process.argv.length <= 2) {
  printHelp();
  process.exit(0);
}

program.parse(process.argv);
