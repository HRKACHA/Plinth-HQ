import { Router } from 'express';
import * as invite from '../controllers/inviteController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// Public
router.get('/verify/:token', invite.verifyInvite);

// Protected — admin & project_manager only
router.post('/send', protect, requireRole('admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'), invite.sendInvite);
router.get('/list', protect, requireRole('admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'), invite.listInvites);
router.delete('/:id', protect, requireRole('admin', 'project_manager', 'PM', 'SuperAdmin', 'owner', 'Owner'), invite.revokeInvite);
// Protected — all authenticated users can accept invites
router.post('/accept/:token', protect, invite.acceptInvite);

export default router;
