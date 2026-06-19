import { Router } from 'express';
import * as chat from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/messages', chat.getMessages);
router.post('/messages', chat.sendMessage);
router.patch('/messages/:id/read', chat.markAsRead);
router.get('/rooms', chat.getRooms);
router.get('/rooms/:id/members', chat.getRoomMembers);

export default router;
