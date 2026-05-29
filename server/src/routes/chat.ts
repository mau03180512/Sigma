import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { streamChat, validateModel } from '../services/nim.js';
import { getConversation, createConversation, saveMessage } from '../services/supabase.js';
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

router.post('/', authenticate, chatRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { messages, model, conversationId, mode } = req.body as {
      messages: { role: string; content: any }[];
      model?: string;
      conversationId?: string;
      mode?: string;
    };

    if (!messages?.length) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    const userId = req.userId!;
    const validatedModel = validateModel(model || 'llama-3.3-70b-versatile');

    console.log(`[Chat] userId=${userId?.slice(0, 8)}... model=${validatedModel} convId=${conversationId || 'new'} mode=${mode || 'none'} messages=${messages.length}`);

    let convId = conversationId;
    if (!convId) {
      const title = extractText(messages[messages.length - 1]?.content).slice(0, 60) || 'New Chat';
      const conv = await createConversation({
        user_id: userId,
        model: validatedModel,
        title,
      });
      convId = conv.id;
      console.log(`[Chat] Created conversation: ${convId} title="${title}"`);
    }

    const systemMessage = { role: 'system', content: SIGMA_SYSTEM_PROMPT };
    const chatMessages = [systemMessage, ...messages];

    if (mode) {
      const modePrompt = getModePrompt(mode);
      if (modePrompt) {
        chatMessages.push({ role: 'system', content: modePrompt });
      }
    }

    const lastMessage = messages[messages.length - 1];
    await saveMessage({
      conversation_id: convId,
      role: 'user',
      content: extractText(lastMessage.content),
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
      console.error(`[Chat] Stream error for conv=${convId}:`, streamError.message);
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

    console.log(`[Chat] Completed conv=${convId} chars=${fullResponse.length}`);
    res.write(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error(`[Chat] Fatal error:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
