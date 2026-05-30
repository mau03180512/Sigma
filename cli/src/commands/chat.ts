import chalk from 'chalk';
import { createInterface } from 'node:readline';
import { streamChat } from '../utils/api.js';
import { printBotMessage, printErrorMessage, printInfoMessage, printHeader } from '../utils/render.js';
import { handleStreamChunk } from '../utils/stream.js';
import { Message, SLASH_COMMANDS } from '../types.js';

export async function chatCommand(options?: {
  model?: string;
  provider?: 'groq' | 'nim';
}): Promise<void> {
  printHeader();
  printInfoMessage(`Type ${chalk.cyan('/help')} for commands, ${chalk.cyan('/exit')} to quit.\n`);

  const messages: Message[] = [];
  let conversationId: string | undefined;
  const model = options?.model;

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('Σ > '),
  });

  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      continue;
    }

    if (input === '/exit' || input === '/quit') {
      console.log(`  ${chalk.dim('Goodbye!')}`);
      rl.close();
      return;
    }

    if (input === '/help') {
      console.log(`\n  ${chalk.bold('Chat Commands:')}`);
      console.log(`    ${chalk.cyan('/exit')}    ${chalk.dim('Exit the chat')}`);
      console.log(`    ${chalk.cyan('/clear')}   ${chalk.dim('Clear conversation history')}`);
      console.log(`    ${chalk.cyan('/help')}    ${chalk.dim('Show this help')}`);
      console.log(``);
      console.log(`  ${chalk.bold('Slash Commands:')}`);
      for (const cmd of SLASH_COMMANDS) {
        console.log(`    ${chalk.cyan(cmd)}`);
      }
      console.log(``);
      rl.prompt();
      continue;
    }

    if (input === '/clear') {
      messages.length = 0;
      conversationId = undefined;
      printInfoMessage('Conversation cleared.\n');
      rl.prompt();
      continue;
    }

    let mode: string | undefined;
    let userPrompt = input;

    for (const cmd of SLASH_COMMANDS) {
      if (input.startsWith(cmd)) {
        mode = cmd;
        userPrompt = input.slice(cmd.length).trim();
        break;
      }
    }

    messages.push({ role: 'user', content: userPrompt });

    let fullResponse = '';
    let currentConvId = conversationId;

    try {
      for await (const chunk of streamChat(messages, {
        model,
        mode,
        provider: options?.provider,
      })) {
        handleStreamChunk(chunk, {
          onContent(text) {
            fullResponse += text;
            process.stdout.write(text);
          },
          onConversationId(id) {
            currentConvId = id;
          },
          onError(error) {
            printErrorMessage(error);
          },
        });
      }

      if (fullResponse) {
        messages.push({ role: 'assistant', content: fullResponse });
        conversationId = currentConvId;
      }

      console.log('\n');
    } catch (error: any) {
      printErrorMessage(error.message);
    }

    rl.prompt();
  }
}
