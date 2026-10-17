import { Router } from 'express';
import { getConversations, createConversation, getMessages, sendMessage } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getConversations);
router.post('/', authenticate, createConversation);
router.get('/:id/messages', authenticate, getMessages);
router.post('/:id/messages', authenticate, sendMessage);

export default router;
