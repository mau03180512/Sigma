import { Router, Request, Response } from 'express';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { streamChat as groqStream, validateModel as groqValidate } from '../services/groq.js';
import { streamChat as nimStream, validateModel as nimValidate } from '../services/nim.js';
import { SIGMA_SYSTEM_PROMPT, getModePrompt } from '../config/systemPrompt.js';

function extractText(content: any): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const textPart = content.find((p: any) => p.type === 'text');
    return textPart?.text || '';
  }
  return String(content);
}

const router = Router();

router.post('/', chatRateLimit, async (req: Request, res: Response) => {
  try {
    const { messages, model, mode, provider } = req.body as {
      messages: { role: string; content: any }[];
      model?: string;
      mode?: string;
      provider?: 'groq' | 'nim';
    };

    if (!messages?.length) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    const activeProvider = provider === 'nim' ? 'nim' : 'groq';
    const validate = activeProvider === 'nim' ? nimValidate : groqValidate;
    const stream = activeProvider === 'nim' ? nimStream : groqStream;

    const validatedModel = validate(model || 'llama-3.3-70b-versatile');

    console.log(`[Chat] model=${validatedModel} provider=${activeProvider} messages=${messages.length}`);

    const systemMessage = { role: 'system', content: SIGMA_SYSTEM_PROMPT };
    const chatMessages = [...messages];

    if (mode) {
      const modePrompt = getModePrompt(mode);
      if (modePrompt) {
        chatMessages.push({ role: 'system', content: modePrompt });
      }
    }

    chatMessages.unshift(systemMessage);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    try {
      for await (const chunk of stream({
        messages: chatMessages as any,
        model: validatedModel,
      })) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    } catch (streamError: any) {
      console.error(`[Chat] Stream error:`, streamError.message);
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
      return;
    }

    console.log(`[Chat] Completed chars=${fullResponse.length}`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error(`[Chat] Fatal error:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
