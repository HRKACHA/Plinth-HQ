import { Router } from 'express';
import * as subscription from '../controllers/subscriptionController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/plans', subscription.listPlans);
router.get('/status', subscription.getStatus);
router.post('/select-plan', subscription.selectPlan);

export default router;
