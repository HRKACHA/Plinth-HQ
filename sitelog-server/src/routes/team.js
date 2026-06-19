import { Router } from 'express';
import * as team from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();
router.use(protect);

router.get('/members', team.listMembers);
router.get('/members/:id', team.getMember);
router.patch('/members/:id/role', requireRole('admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'), team.changeRole);
router.patch('/members/:id/deactivate', requireRole('admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'), team.deactivateMember);
router.delete('/members/:id', requireRole('admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'), team.deleteMember);

export default router;
