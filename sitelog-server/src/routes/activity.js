import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getRecentActivity } from '../controllers/activityController.js';

const router = Router();

router.get('/', protect, getRecentActivity);

export default router;
