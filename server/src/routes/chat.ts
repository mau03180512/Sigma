import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { streamChat, validateModel } from '../services/nim.js';
import { getConversation, createConversation, saveMessage } from '../services/supabase.js';
import { SIGMA_SYSTEM_PROMPT, getModePrompt } from '../config/systemPrompt.js';

const router = Router();

router.post('/', authenticate, chatRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { messages, model, conversationId, mode } = req.body as {
      messages: { role: string; content: string }[];
      model?: string;
      conversationId?: string;
      mode?: string;
    };

    if (!messages?.length) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    const userId = req.userId!;
    const validatedModel = validateModel(model || 'deepseek-ai/deepseek-v4-flash');

    let convId = conversationId;
    if (!convId) {
      const conv = await createConversation({
        user_id: userId,
        model: validatedModel,
      });
      convId = conv.id;
    }

    const systemMessage = { role: 'system', content: SIGMA_SYSTEM_PROMPT };
    const chatMessages = [systemMessage, ...messages];

    if (mode) {
      const modePrompt = getModePrompt(mode);
      if (modePrompt) {
        chatMessages.push({ role: 'system', content: modePrompt });
      }
    }

    await saveMessage({
      conversation_id: convId,
      role: 'user',
      content: messages[messages.length - 1].content,
      model: validatedModel,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Conversation-Id', convId);

    let fullResponse = '';

    try {
      for await (const chunk of streamChat({
        messages: chatMessages as any,
        model: validatedModel,
      })) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk, conversationId: convId })}\n\n`);
      }
    } catch (streamError: any) {
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
      return;
    }

    await saveMessage({
      conversation_id: convId,
      role: 'assistant',
      content: fullResponse,
      model: validatedModel,
    });

    res.write(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
