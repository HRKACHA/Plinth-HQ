import { Router } from 'express';
import * as owner from '../controllers/ownerController.js';

const router = Router();
router.get('/:shareToken', owner.getOwnerDashboard);
export default router;
