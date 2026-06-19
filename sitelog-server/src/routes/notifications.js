import { Router } from 'express';
import * as notification from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/', notification.listNotifications);
router.put('/:nId/read', notification.markRead);
router.put('/read-all', notification.markAllRead);
export default router;
