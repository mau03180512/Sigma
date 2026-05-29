import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.js';
import { generalRateLimit } from '../middleware/rateLimit.js';
import {
  getConversations,
  getConversation,
  getMessages,
  createConversation,
  updateConversation,
  deleteConversation,
} from '../services/supabase.js';

const router = Router();

router.use(authenticate);
router.use(generalRateLimit);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await getConversations(req.userId!);
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await getConversation(req.params.id);
    if (!conversation || conversation.user_id !== req.userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    const messages = await getMessages(req.params.id);
    res.json({ ...conversation, messages });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await createConversation({
      user_id: req.userId!,
      title: req.body.title || 'New Chat',
      model: req.body.model,
    });
    res.status(201).json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await getConversation(req.params.id);
    if (!conversation || conversation.user_id !== req.userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    await updateConversation(req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await getConversation(req.params.id);
    if (!conversation || conversation.user_id !== req.userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    await deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
