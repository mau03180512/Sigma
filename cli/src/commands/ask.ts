import { streamChat } from '../utils/api.js';
import { printBotMessage, printErrorMessage } from '../utils/render.js';
import { handleStreamChunk } from '../utils/stream.js';
import { Message, SLASH_COMMANDS } from '../types.js';

function detectMode(prompt: string): { prompt: string; mode?: string } {
  for (const cmd of SLASH_COMMANDS) {
    if (prompt.startsWith(cmd)) {
      return { prompt: prompt.slice(cmd.length).trim(), mode: cmd };
    }
  }
  return { prompt };
}

export async function askCommand(
  prompt: string,
  options?: { model?: string; provider?: 'groq' | 'nim' }
): Promise<void> {
  const { prompt: cleanPrompt, mode } = detectMode(prompt);

  const messages: Message[] = [{ role: 'user', content: cleanPrompt }];
  let fullText = '';
  let spinner: any = undefined;

  try {
    const { default: ora } = await import('ora');

    if (!process.stdin.isTTY) {
      spinner = ora({ text: 'Sigma is thinking...', color: 'cyan' }).start();
    }

    for await (const chunk of streamChat(messages, {
      model: options?.model,
      mode,
      provider: options?.provider,
    })) {
      handleStreamChunk(chunk, {
        onContent(text) {
          fullText += text;
          if (spinner) {
            spinner.stop();
            spinner = undefined;
          }
          process.stdout.write(text);
        },
        onError(error) {
          if (spinner) spinner.stop();
          printErrorMessage(error);
        },
      });
    }

    if (fullText) {
      console.log('');
    } else {
      if (spinner) spinner.stop();
    }
  } catch (error: any) {
    if (spinner) spinner.stop();
    printErrorMessage(error.message);
    process.exit(1);
  }
}
